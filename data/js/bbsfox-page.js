"use strict";

const ICON_LOGO = "chrome://bbsfox/skin/logo/logo.png";
const ICON_CONNECT = "chrome://bbsfox/skin/state_icon/connect.png";
const ICON_DISCONNECT = "chrome://bbsfox/skin/state_icon/disconnect.png";
const ICON_CONNECTING = "chrome://bbsfox/skin/state_icon/connecting.gif";
const ICON_ERROR = "chrome://bbsfox/skin/state_icon/error.png";

const {Cc, Ci} = require("chrome");
let {viewFor} = require("sdk/view/core");
let {modelFor} = require("sdk/model/core");

const pageMod = require("sdk/page-mod");
let { PrefsTarget } = require("sdk/preferences/event-target");

let tabs = require("sdk/tabs");
let tabUtils = require("sdk/tabs/utils");
let winUtils = require("sdk/window/utils");

let system = require("sdk/system");
let { setTimeout } = require("sdk/timers");
let notifications = require("sdk/notifications");
let soundService = Cc["@mozilla.org/sound;1"].createInstance(Ci.nsISound);
let { bbsfoxAPI, setAPICallback } = require("./bbsfox-api.js");

require("sdk/system/events").on("http-on-modify-request", event => {
  let channel = event.subject.QueryInterface(Ci.nsIHttpChannel);
  let targetURI = channel.URI;
  //ONLY override referrer string for target http://ppt.cc/
  //example: http://ppt.cc/gFtO@.jpg -> http://ppt.cc/gFtO
  let urlStr = decodeURI(targetURI.spec);
  if(urlStr.search(/^(http:\/\/ppt\.cc\/).{4,6}@\.(bmp|gif|jpe?g|png)$/i) != -1) {
    let ref = urlStr.split(/@/i);
    let override = false;
    if(!targetURI.hasRef) {
      override = true;
    }
    else if(targetURI.hasRef && targetURI.ref != ref[0]) {
      override = true;
    }
    if(override) {
      channel.setRequestHeader("Referer", ref[0], false);
    }
  }
});

//
function BBSConnection (owner, worker, host, port, proxy) {
  // this.transport = null;
  // this.inputStream = null;
  // this.outputStream = null;
  // this._inputStream = null;
  // this.ipump = null;
  this.alive = true;
  this.icon = ICON_LOGO;
  this.owner = owner;
  this.worker = worker;
  let proxyInfo = null;
  if (proxy.type != "") {// use a proxy
    proxyInfo = this.ps.newProxyInfo(proxy.type, proxy.host, proxy.port, Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST, 30, null);
  }
  this.transport = this.ts.createTransport(null, 0, host, port, proxyInfo);
  this._inputStream = this.transport.openInputStream(0,0,0);
  this.outputStream = this.transport.openOutputStream(0,0,0);
  this.inputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
  this.inputStream.setInputStream(this._inputStream);
  this.pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
  this.pump.init(this._inputStream, -1, -1, 0, 0, false);
  this.pump.asyncRead(this, null);
}

BBSConnection.prototype = {
  ts: Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService),
  ps: Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService),

  onStartRequest: function(req, ctx){
    this.icon = ICON_CONNECT;
    this.updateStatus();
    this.worker.port.emit("bbsfox@ettoolong:bbsfox-connect", {});
  },

  onStopRequest: function(req, ctx, status){
    if(this.alive) {
      this.icon = ICON_DISCONNECT;
      this.updateStatus();
      this.worker.port.emit("bbsfox@ettoolong:bbsfox-disconnect", {status: status});
    }
  },

  onDataAvailable: function(req, ctx, ins, off, count) {
    let data="";
    while(this.inputStream && count > 0) {
      let s = this.inputStream.readBytes(count);
      count -= s.length;
      this.worker.port.emit("bbsfox@ettoolong:bbsfox-data", {data: s});
    };
  },

  close: function() {
    this.icon = ICON_DISCONNECT;
    this.updateStatus();
    this.alive = false;
    if(this._inputStream && this.inputStream && this.outputStream) {
      this._inputStream.close();
      this.inputStream.close();
      this.outputStream.close();
      this._inputStream = this.inputStream = this.outputStream = this.transport = null;
    }
  },

  updateStatus: function() {
    this.owner.updateTabIcon(this.icon, this.worker);
  },

  send: function(str) {
    this.outputStream.write(str, str.length);
    this.outputStream.flush();
  }
}
//

//bbsfoxPage: handle keyboard, mouse, scroll and context menu event for telnet/ssh page
let bbsfoxPage = {
  tempFiles: [],
  eventMap: new Map(),
  urlCheck : /(^(telnet|ssh):\/\/)/i,
  os: system.platform,
  doDOMMouseScroll: false,
  globalMouseRBtnDown: false,
  mouseRBtnDown: false,
  globalMouseLBtnDown: false,
  mouseLBtnDown: false,
  pm: null,
  connections: [],

  isBBSPage: function(url) {
    //check if this page protocol is telnet/ssh
    return this.urlCheck.test(url);
  },

  addWorker: function (worker) {
    worker.alive = true;
    worker.tabId = worker.tab.id;
    this.connections.push({worker: worker, conn: null});
  },

  removeWorker: function (worker) {
    //close
    let connection = this.getConnectionByWorker(worker);
    if(connection) {
      if(connection.conn)
        connection.conn.close();
    }
    this.connections = this.connections.filter( c => c.worker != worker);
  },

  getConnectionByWorker: function (worker) {
    return this.connections.find( c => c.worker == worker);
  },

  getWorkerByTab: function (tab) {
    let connection = this.connections.find( c => c.worker.tabId == tab.id);
    if(connection)
      return connection.worker;
    else
      return;
  },

  geXulTabBytWorker: function (worker) {
    return tabUtils.getTabForId(worker.tabId);
  },

  getDOMWindowByWorker: function (worker) {
    let xulTab = tabUtils.getTabForId(worker.tabId);
    let chromeWindow = tabUtils.getOwnerWindow(xulTab);
    return chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
  },

  // getBrowserByWorker: function (worker) {
  //   let xulTab = tabUtils.getTabForId(worker.tabId);
  //   return tabUtils.getBrowserForTab(xulTab);
  // },

  rebuildWorkerMapping: function (worker) {
    let workerTabIds = this.connections.filter( c => c.worker != worker).map( c2 => c2.worker.tabId );
    let allWindows = winUtils.windows(null, {includePrivate:true});
    for (let chromeWindow of allWindows) {
      if(winUtils.isBrowser(chromeWindow)) {
        this.onWinOpen( chromeWindow );
        let openedTabs = tabUtils.getTabs( chromeWindow );
        for(let openedTab of openedTabs) {
          let uri = tabUtils.getURI(openedTab);
          if(this.isBBSPage(uri)) {
            let workerTabId = modelFor(openedTab).id;
            if( !workerTabIds.includes(workerTabId) ) {
              //console.log('set ' + worker.tabId + ' -> ' + workerTabId);
              worker.tabId = workerTabId;
              return;
            }
          }
        }
      }
    }
  },

  loadPageMod: function () {
    this.pm = pageMod.PageMod({
      include: ["telnet://*", "ssh://*"],
      attachTo: ["existing", "top"],
      contentScriptFile: this.addonData.url("js/content-script.js"),
      contentScriptWhen: "end",
      onAttach: worker => {
        this.addWorker(worker);
        worker.port.on("bbsfox@ettoolong:bbsfox-coreCommand", msg => {
          this.handleCoreCommand({worker: worker, data: msg});
        });
        worker.on("pageshow", () => {
          // addon sdk bug :(  see: https://bugzil.la/1259292
          if(!worker.tab) {
            this.rebuildWorkerMapping(worker);
            setTimeout(() => {
              let connection = this.getConnectionByWorker(worker);
              if(connection) {
                connection.conn.updateStatus();
              }
            }, 1000);
          }
        });
        worker.on("detach", () => {
          this.removeWorker(worker);
        });
      }
    });
    setAPICallback(commandSet => {
      this.setBBSCmdEx(commandSet);
    });
  },

  handleCoreCommand: function(message) {

    //must make sure command from BBS page.
    let data = message.data;
    switch (data.command) {
      case "sendData":
        this.sendData(data, message.worker);
        break;
      case "createSocket":
        this.createSocket(data, message.worker);
        break;
      // case "updateTabIcon": {
      //   message.worker.tabImage = message.data.icon;
      //   tabUtils.getTabForId(message.worker.tabId).image = message.data.icon;
      //   //tabUtils.getTabForBrowser( message.target ).image = message.data.icon;
      //   break;
      // }
      case "openNewTabs":
        this.openNewTabs(data.urls, data.ref, data.charset, data.loadInBg);
        break;
      case "resetStatusBar":
        this.resetStatusBar( message.worker );
        break;
      case "updateEventPrefs": {
        message.worker.eventPrefs = data.eventPrefs;
        //tabUtils.getTabForBrowser( message.target ).eventPrefs = data.eventPrefs;
        break;
      }
      case "writePrefs":
        this.writePrefs(data.branchName, data.name, data.vtype, data.value);
        break;
      // case "removeStatus": {
      //   //tabUtils.getTabForBrowser( message.target ).eventPrefs;
      //   let tab = tabUtils.getTabForBrowser( message.target );
      //   if(tab) {
      //     delete tab.eventPrefs;
      //   }
      //   break;
      // }
      case "contentScriptReady": {
        let xulTab = this.geXulTabBytWorker(message.worker);
        if(xulTab.selected)
          this.setBBSCmd("setTabSelect", message.worker );
        break;
      }
      case "loadAutoLoginInfo":
        this.loadAutoLoginInfo(data.querys, message.worker);
        break;
      case "openEasyReadingTab":
        this.openEasyReadingTab(data.htmlData);
        break;
      case "openFilepicker":
        this.openFilepicker(data, message.worker);
        break;
      case "pushThreadDlg":
        this.pushThreadDlg(data, message.worker);
        break;
      case "showNotifyMessage":
        this.showNotifyMessage(data, message.worker);
        break;
      case "fireNotifySound":
        this.playNotifySound();
        break;
      case "popupVideoWindow":
        this.popupVideoWindow(data.url, message.worker);
        break;
      default:
        break;
    }
  },

  sendData: function(data, worker) {
    let connection = this.getConnectionByWorker(worker);
    if(connection) {
      connection.conn.send(data.str);
    }
  },

  createSocket: function(data, worker) {
    let connection = this.getConnectionByWorker(worker);
    if(connection) {
      connection.conn = new BBSConnection(this, worker, data.host, data.port, data.proxy);
    }
  },

  updateTabIcon: function(icon, worker) {
    let xulTab = this.geXulTabBytWorker(worker);
    if(xulTab) {
      xulTab.image = icon;
    }
  },

  resetStatusBar: function(worker) {
    let aDOMWindow = this.getDOMWindowByWorker(worker);
    aDOMWindow.XULBrowserWindow.setOverLink('');
  },

  loadAutoLoginInfo: function(querys, worker) {
    let result = {};
    for(let query of querys){
      try{
        let logins = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager).findLogins({}, query.url, query.ds, null);
        if(logins.length) {
          result[query.protocol] = { userName: logins[0]["username"], password: logins[0]["password"] };
        }
        else {
          result[query.protocol] = { userName: '', password: '' };
        }
      }
      catch(ex){
        result[query.protocol] = { userName: '', password: '' };
      }
    }
    let key_entries;
    if(result.ssh) {
      key_entries = [];
    }
    this.setBBSCmdEx({command: "loginInfoReady", result: result, hostkeys: key_entries}, worker);
  },

  openEasyReadingTab: function(htmlData) {
    let filetmp = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
    filetmp.append("easyreading.htm");
    filetmp.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);
    let ostream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    ostream.init(filetmp, -1, -1, 0);
    let converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
    converter.init(ostream, "UTF-8", 0, 0);
    converter.writeString(htmlData);
    converter.flush();
    converter.close();
    let tempURI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newFileURI(filetmp).spec;
    this.openNewTabs([tempURI], null, "UTF-8", true);
    this.tempFiles.push(filetmp);
  },

  pushThreadDlg: function(data, worker) {
    let EMURL = "chrome://bbsfox/content/pushThread.xul";
    let EMFEATURES = "chrome, dialog=yes, resizable=yes, modal=yes, centerscreen";
    let retVals = { exec: false, pushText: data.pushText, lineLength: data.lineLength};
    let retVals2 = [];
    let aDOMWindow = this.getDOMWindowByWorker(worker);
    aDOMWindow.openDialog(EMURL, "", EMFEATURES, retVals, retVals2);
    if(retVals.exec) {
      this.setBBSCmdEx({command:"sendPushThreadText",
                        sendText:retVals2,
                        temp:""
                      }, worker);
    }
    else {
      this.setBBSCmdEx({command:"sendPushThreadText",
                        temp: retVals.pushText
                      }, worker);
    }
  },

  showNotifyMessage: function(data, worker){
    let msg = {
      iconURL: data.imageUrl,
      title: data.title,
      text: data.text,
      onClick: function () {
        //console.log(data);
      }
    };
    if(data.textClickable) {
      msg.onClick = () => {
        this.setTabActive(worker);
        if(data.replyString) {
          this.setBBSCmdEx({command:"sendText", text: data.replyString}, worker);
        }
      }
    }
    notifications.notify(msg);
  },

  popupVideoWindow: function(url, target) {
    let aDOMWindow = this.getDOMWindowByWorker(worker);
    if(aDOMWindow.PopupVideo_API)
      aDOMWindow.PopupVideo_API.popupVideo(url);
  },

  playNotifySound: function(){
    if(soundService) {
      soundService.beep();
    }
  },

  setTabActive: function(worker) {
    let xulTab = tabUtils.getTabForId(worker.tabId);
    tabUtils.activateTab(xulTab, tabUtils.getOwnerWindow(xulTab));
  },

  openFilepicker: function(data, worker) {
    let title = data.title;
    let mode = data.mode;
    let extension = data.defaultExtension;
    let defaultStr = data.defaultString;
    let filters = data.appendFilters;
    let writeData = data.saveData;
    let convertUTF8 = data.convertUTF8;
    let utf8BOM = data.utf8BOM;
    let postCommand = data.postCommand;

    let nsIFilePicker = Ci.nsIFilePicker;
    let fileChooser = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    let aDOMWindow = this.getDOMWindowByWorker(worker);
    fileChooser.init(aDOMWindow, title, mode);
    if(extension)
      fileChooser.defaultExtension = extension;
    if(defaultStr) {
      if(this.os === "darwin")
        fileChooser.defaultString = defaultStr + "." + extension;
      else
        fileChooser.defaultString = defaultStr;
    }
    for(let filter of filters)
      fileChooser.appendFilters(filter);

    fileChooser.open(function(result) {
      //returnOK        0
      //returnCancel    1
      //returnReplace   2
      if(result != nsIFilePicker.returnCancel) {
        if(mode == nsIFilePicker.modeSave) {
          // file is nsIFile, data is a string
          let foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
          if(fileChooser.file.exists()){
            fileChooser.file.remove(true);
          }
          fileChooser.file.create(fileChooser.file.NORMAL_FILE_TYPE, 0o666);
          foStream.init(fileChooser.file, 0x02 | 0x08 | 0x20, 0o666, null);
          if(convertUTF8) {
            if(utf8BOM)
              foStream.write("\u00EF\u00BB\u00BF", 3); //write UTF-8 BOM
            let converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
            converter.init(foStream, "UTF-8", 0, 0);
            converter.writeString(writeData);
            converter.close(); // this closes foStream
          }
          else {
            foStream.write(writeData, writeData.length);
            if (foStream instanceof Ci.nsISafeOutputStream)
              foStream.finish();
            else
              foStream.close();
          }
        }
        else if(mode == nsIFilePicker.modeOpen) {
          let fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
          // Read data with 2-color DBCS char
          fstream.init(fileChooser.file, -1, -1, false);
          let bstream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
          bstream.setInputStream(fstream);
          let bytes = bstream.readBytes(bstream.available());
          if(postCommand) {
            this.setBBSCmdEx({command: postCommand, fileData: bytes}, worker);
          }
          bstream.close();
          fstream.close();
        }
      }
    }.bind(this));
  },

  openNewTabs: function(urls, ref, charset, loadInBg) {
    //https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/tabs
    //TODO: check private-browsing use case.
    for(let url of urls) {
      /*
      // We need 'relatedToCurrent' to make new tab at right position,
      // it base on about:config -> browser.tabs.insertRelatedAfterCurrent setting.
      // sdk/tabs don't support this feature
      tabs.open({
        url: url,
        inBackground: loadInBg
      });
      */
      let gBrowser = winUtils.getMostRecentBrowserWindow().gBrowser;
      gBrowser.loadOneTab(url, {
        referrerURI: null,
        charset: null,
        inBackground: loadInBg,
        relatedToCurrent: true
      });
    }
  },

  writePrefs: function(branchName, name, vtype, value) {
    let prefs = Cc["@mozilla.org/preferences-service;1"].
                 getService(Ci.nsIPrefService).
                 getBranch(branchName);
    if(vtype == Ci.nsIPrefBranch.PREF_BOOL) {
      prefs.getBoolPref(name, value);
    }
    else if(vtype == Ci.nsIPrefBranch.PREF_INT) {
      prefs.setIntPref(name, value);
    }
    else if(vtype == Ci.nsIPrefBranch.PREF_STRING) {
      let nsIString = Cc["@mozilla.org/supports-string;1"]
                       .createInstance(Ci.nsISupportsString);
      nsIString.data = value;
      prefs.setComplexValue(name, Ci.nsISupportsString, nsIString);
    }
  },

  setBroadcastCmd: function(command) {
    for(let connection of this.connections) {
      this.setBBSCmdEx({command: command}, connection.worker);
    }
  },

  setBBSCmdEx: function(commandSet, worker) {
    if(!worker) {
      let tab = tabs.activeTab;
      if(!tab) {
        //console.log(commandSet);
      }
      if(this.isBBSPage(tab.url)) { // telnet:// or ssh://
        worker = this.getWorkerByTab(tab);
      }
    }
    if(worker && worker.alive) {
      worker.port.emit("bbsfox@ettoolong:bbsfox-overlayCommand", commandSet);
    }
  },

  setBBSCmd: function(command, worker) {
    this.setBBSCmdEx({command: command}, worker);
  },

  setItemVisible: function(doc, id, visible, checkHidden) {
    let menuitem = doc.getElementById(id);
    if(menuitem) {
      if(checkHidden)
        menuitem.hidden = (menuitem.hidden || !visible);
      else
        menuitem.hidden = !visible;
    }
  },

  handle_mouse_scroll: function (params) {
    let {event, tab, e10s} = params;
    let uri = tabUtils.getURI(tab);
    if(!this.isBBSPage(uri)) {
      return;
    }

    let worker = this.getWorkerByTab(modelFor(tab));
    let eventPrefs = worker.eventPrefs;

    // let browser = e10s ? event.target.mCurrentBrowser : null;

    let actions = [["",""],
                   ["doArrowUp", "doArrowDown"],
                   ["doPageUp","doPageDown"],
                   ["prevousThread","nextThread"],
                   ["doHome","doEnd"]];

    let mouseWheelFunc = [eventPrefs.mouseWheelFunc1,
                          eventPrefs.mouseWheelFunc2,
                          eventPrefs.mouseWheelFunc3]

    let direction = event.detail < 0 ? 0 :1;

    if(mouseWheelFunc[0] || mouseWheelFunc[1] || mouseWheelFunc[2]) {

      if(this.globalMouseRBtnDown !== this.mouseRBtnDown)
        return;

      //let action = actions
      let mouseButton;
      if(this.mouseRBtnDown)
        mouseButton = 1;
      else if(this.mouseLBtnDown)
        mouseButton = 2;
      else
        mouseButton = 0;

      let action = actions[mouseWheelFunc[mouseButton]][direction];
      if(action !== "") {
        this.setBBSCmd(action);
        event.stopPropagation();
        event.preventDefault();

        if(this.mouseRBtnDown) {//prevent context menu popup
          this.doDOMMouseScroll = true;
        }
        if(this.mouseLBtnDown) {
          //TODO: fix this, tell content page skip this mouse click.
          if(eventPrefs.useMouseBrowsing) {
            this.setBBSCmd("skipMouseClick");
          }
        }
      }
    }

  },

  mouse_scroll_e10s: function (event) {
    if(event.target.tagName!="tabbrowser" || event.target.getAttribute("id") != "content") {
      return;
    }
    let tab = event.target.mCurrentTab; //tabUtils.getTabForBrowser(event.target);
    this.handle_mouse_scroll({event: event, tab: tab, e10s:true});
  },

  mouse_scroll: function (event) {
    let tab = tabs.activeTab;
    let xulTab = tabUtils.getTabForId(tab.id);
    this.handle_mouse_scroll({event: event, tab: xulTab, e10s:false});
  },

  mouse_menu: function (event) {
    let tab = tabs.activeTab;
    if(!this.isBBSPage(tab.url))
      return;

    let worker = this.getWorkerByTab(tab);
    let eventPrefs = worker.eventPrefs;

    let mouseWheelFunc2 = (eventPrefs.mouseWheelFunc2 != 0);
    if(mouseWheelFunc2) {

      if(this.doDOMMouseScroll) {
        event.stopPropagation();
        event.preventDefault();
        //this.doDOMMouseScroll = false;
      }
      else {
        if(this.os == "winnt") {
          //do nothing...
        }
        else if(this.mouseRBtnDown) {//if Linux or Mac, delay popup menu.
          event.stopPropagation();
          event.preventDefault();
          return;
        }
      }
    }
  },

  mouse_down: function (event) {
    if(event.button==2) {
      this.globalMouseRBtnDown = true;
    }
    else if(event.button==0) {
      this.globalMouseLBtnDown = true;
    }

    let tab = tabs.activeTab;
    if(!this.isBBSPage(tab.url))
      return;

    if(event.button==2) {
      this.mouseRBtnDown = true;
      this.doDOMMouseScroll = false;
    }
    else if(event.button==0) {
      this.mouseLBtnDown = true;
    }
  },

  mouse_up: function (event) {
    if(event.button==2) {
      this.globalMouseRBtnDown = false;
      this.mouseRBtnDown = false;
    }
    else if(event.button==0) {
      this.globalMouseLBtnDown = false;
      this.mouseLBtnDown = false;
    }

    let tab = tabs.activeTab;
    if(!this.isBBSPage(tab.url))
      return;

    let worker = this.getWorkerByTab(tab);
    let eventPrefs = worker.eventPrefs;

    let mouseWheelFunc2 = (eventPrefs.mouseWheelFunc2 != 0);
    if(mouseWheelFunc2) {
      if(event.button==2) {
        if(this.os == "winnt") {
          //do nothing...
        }
        else {//if Linux or Mac, show popup menu.
          if(!this.doDOMMouseScroll) {
            this.setBBSCmdEx({command:"contextmenu",
                              screenX:event.screenX,
                              screenY:event.screenY,
                              clientX:event.clientX,
                              clientY:event.clientY});

          }
        }
      }
    }
  },

  key_press: function (event) {

    let tab = tabs.activeTab;
    if(!this.isBBSPage(tab.url))
      return;

    let worker = this.getWorkerByTab(tab);
    let eventPrefs = worker.eventPrefs;

    //let browser = event.target.mCurrentBrowser;
    if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch(event.keyCode) {
        case 33: //Page Up
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doPageUp", worker);
          return;
        case 34: //Page Down
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doPageDown", worker);
          return;
        case 38: //Arrow Up
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doArrowUp", worker);
          return;
        case 40: //Arrow Down
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doArrowDown", worker);
          return;
        default:
          break;
      }
    }
    if(event.charCode){
      if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 118 || event.charCode == 86) && eventPrefs.hokeyForPaste) { //Shift + ^V, do paste
        this.setBBSCmd("doPaste", worker);
        event.preventDefault();
        event.stopPropagation();
      }

      if (event.ctrlKey && !event.altKey && !event.shiftKey) {
        if((event.charCode==109 || event.charCode==77) && eventPrefs.hokeyForMouseBrowsing) {
          this.setBBSCmd("switchMouseBrowsing", worker);
          event.stopPropagation();
          event.preventDefault();
        }
        if(this.os != "darwin") {
          if((event.charCode==119 || event.charCode==87) && eventPrefs.hotkeyCtrlW == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:23}, worker);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==98 || event.charCode==66) && eventPrefs.hotkeyCtrlB == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:2}, worker);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==108 || event.charCode==76) && eventPrefs.hotkeyCtrlL == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:12}, worker);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==116 || event.charCode==84) && eventPrefs.hotkeyCtrlT == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:20}, worker);
            event.stopPropagation();
            event.preventDefault();
          }
        }
      }
    }

  },

  bbsfoxContextMenuShowing: function(event) {
    let sortItem = event.target.getAttribute("sortItem");
    if(!sortItem) {
      //console.log("sort context menu items");
      let menuItems = event.target.childNodes;
      // sort items - start
      // only need do this once.
      let refNodes = {
        "context-copy": {},
        "context-selectall": {},
        "context-viewimage": {}
      };
      let moveNodes = {
        "bbsfox_menu-ansiCopy": null,
        "bbsfox_menu-openAllLink": null,
        "bbsfox_menu-viewimage": null
      };
      for(let menuItem of menuItems) {
        let id = menuItem.getAttribute("id");
        if(id) {
          if(refNodes[id]) {
            refNodes[id].self = menuItem;
            refNodes[id].next = menuItem.nextSibling;
            refNodes[id].label = menuItem.getAttribute("label");
            refNodes[id].accesskey = menuItem.getAttribute("accesskey");
          }
        }
        let value = menuItem.getAttribute("value");
        if(value && /^bbsfox_/.test(value)) {
          menuItem.setAttribute("id", value);
          moveNodes[value] = menuItem;
        }
      }
      //TODO: TypeError: Argument 1 of Node.insertBefore is not an object.
      if(moveNodes["bbsfox_menu-ansiCopy"] && moveNodes["bbsfox_menu-openAllLink"] && moveNodes["bbsfox_menu-viewimage"] ) {
        event.target.setAttribute("sortItem", "true");
        event.target.insertBefore(moveNodes["bbsfox_menu-ansiCopy"], refNodes["context-copy"].next);
        event.target.insertBefore(moveNodes["bbsfox_menu-openAllLink"], refNodes["context-selectall"].next);
        event.target.insertBefore(moveNodes["bbsfox_menu-viewimage"], refNodes["context-viewimage"].next);
        moveNodes["bbsfox_menu-viewimage"].setAttribute("label", refNodes["context-viewimage"].label);
        moveNodes["bbsfox_menu-viewimage"].setAttribute("accesskey", refNodes["context-viewimage"].accesskey);
      }
      // sort items - end
    }
    //context-paste
    //previousSibling
    let tab = tabs.activeTab;
    if(this.isBBSPage(tab.url)) {
      let worker = this.getWorkerByTab(tab);
      let eventPrefs = worker.eventPrefs;

      if(eventPrefs) {
        //console.log(event.target);
        let doc = event.target.ownerDocument;
        if(!this.contextLink)
          this.setItemVisible(doc, "context-paste", true);

        // this.setItemVisible(doc, "context-back", false);
        // this.setItemVisible(doc, "context-forward", false);
        // this.setItemVisible(doc, "context-reload", false);
        // this.setItemVisible(doc, "context-stop", false);
        this.setItemVisible(doc, "context-navigation", false);
        this.setItemVisible(doc, "context-sep-navigation", false);

        this.setItemVisible(doc, "context-viewimage", false);
        this.setItemVisible(doc, "context-viewbgimage", false);
        this.setItemVisible(doc, "context-sep-viewbgimage", false);

        this.setItemVisible(doc, "context-viewpartialsource-selection", false);
        this.setItemVisible(doc, "context-viewpartialsource-mathml", false);

        if(eventPrefs.hideBookMarkLink) {
          this.setItemVisible(doc, "context-bookmarklink", false);
        }
        if(eventPrefs.hideSendLink) {
          this.setItemVisible(doc, "context-sendlink", false);
        }
        if(eventPrefs.hideSendPage) {
          this.setItemVisible(doc, "context-sendpage", false);
          this.setItemVisible(doc, "context-sharepage", false);
        }
        if(eventPrefs.hideViewSource && eventPrefs.hideViewInfo) {
          this.setItemVisible(doc, "context-sep-viewsource", false);
        }
        if(eventPrefs.hideViewSource) {
          this.setItemVisible(doc, "context-viewsource", false);
        }
        if(eventPrefs.hideViewInfo) {
          this.setItemVisible(doc, "context-viewinfo", false);
        }
        if(eventPrefs.hideInspect) {
          this.setItemVisible(doc, "inspect-separator", false);
          this.setItemVisible(doc, "context-inspect", false);
        }
      }
    }
    this.resetFocus = true;
  },

  bbsfoxContextMenuShown: function(event) {
    let menuItems = event.target.childNodes;
    let item = null;
    let separator = null;
    let oneVisible = false;
    for(let menuItem of menuItems) {
      let id = menuItem.getAttribute("id");
      let className = menuItem.getAttribute("class");
      if(id === "context-paste") {
        menuItem.disabled = false;
      }
      if(className === "addon-context-menu-separator") {
        if(!item) {
          separator = item = menuItem;
        }
      }
    }
    if(item) {
      while(item.nextSibling) {
        item = item.nextSibling;
        let className = item.getAttribute("class");
        if(className === "addon-context-menu-separator") {
          separator = item;
          oneVisible = false;
          //console.log("separator start");
        }
        else if(!item.hidden) {
          //console.log(item);
          oneVisible = true;
        }
      }
      if(!oneVisible) {
        separator.hidden = true;
      }
    }
  },

  bbsfoxContextMenuHidden: function(event) {
    if(event.target.getAttribute("id") === "contentAreaContextMenu") {
      if(!this.selectionText && this.resetFocus) {
        this.setBBSCmd("setInputAreaFocus");
      }
    }
  },

  tabAttrModified: function(event) {
    let worker = this.getWorkerByTab(modelFor(event.target));
    if(worker && worker.tabImage)
      event.target.image = worker.tabImage;
    this.setBBSCmd("updateCursor");
  },

  init: function(data) {
    this.addonData = data;
    this.eventMap.set("DOMMouseScroll-E10S", this.mouse_scroll_e10s.bind(this));
    this.eventMap.set("DOMMouseScroll", this.mouse_scroll.bind(this));
    this.eventMap.set("contextmenu", this.mouse_menu.bind(this));
    this.eventMap.set("mousedown", this.mouse_down.bind(this));
    this.eventMap.set("mouseup", this.mouse_up.bind(this));
    this.eventMap.set("keypress", this.key_press.bind(this));

    this.eventMap.set("caContextMenu-ps", this.bbsfoxContextMenuShowing.bind(this));
    this.eventMap.set("caContextMenu-ps2", this.bbsfoxContextMenuShown.bind(this));
    this.eventMap.set("caContextMenu-ph", this.bbsfoxContextMenuHidden.bind(this));

    this.eventMap.set("tabAttrModified", this.tabAttrModified.bind(this));
    this.eventMap.set("handleCoreCommand", this.handleCoreCommand.bind(this));
    PrefsTarget({ branchName: "extensions.bbsfox1." }).on("Update", prefName => {
      this.setBroadcastCmd("checkPrefExist");
    });
  },

  onWinOpen: function(chromeWindow) {
    let useRemoteTabs = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor)
     .getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsILoadContext).useRemoteTabs;
    //console.log("useRemoteTabs = " + useRemoteTabs);

    let chromeBrowser = chromeWindow.gBrowser; //chromeBrowser undefined????
    if(chromeBrowser) {
      chromeWindow.BBSFox_API = bbsfoxAPI;
      if(useRemoteTabs)
        chromeWindow.addEventListener("DOMMouseScroll", this.eventMap.get("DOMMouseScroll-E10S"), true);
      else
        chromeWindow.addEventListener("DOMMouseScroll", this.eventMap.get("DOMMouseScroll"), true);

      chromeBrowser.addEventListener("contextmenu", this.eventMap.get("contextmenu"), true);
      chromeBrowser.addEventListener("mousedown", this.eventMap.get("mousedown"), true);
      chromeBrowser.addEventListener("mouseup", this.eventMap.get("mouseup"), true);
      chromeBrowser.addEventListener("keypress", this.eventMap.get("keypress"), true);
      chromeBrowser.tabContainer.addEventListener("TabAttrModified", this.eventMap.get("tabAttrModified"), true);

      let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);

      let contentAreaContextMenu = aDOMWindow.document.getElementById("contentAreaContextMenu");

      if(contentAreaContextMenu) {
        contentAreaContextMenu.addEventListener("popupshowing", this.eventMap.get("caContextMenu-ps"), false);
        contentAreaContextMenu.addEventListener("popupshown", this.eventMap.get("caContextMenu-ps2"), false);
        contentAreaContextMenu.addEventListener("popuphidden", this.eventMap.get("caContextMenu-ph"), false);
      }
    }
  },

  onWinClose: function(chromeWindow) {
    let useRemoteTabs = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor)
     .getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsILoadContext).useRemoteTabs;

    let chromeBrowser = chromeWindow.gBrowser;
    if(chromeBrowser) {
      delete chromeWindow.BBSFox_API;
      if(useRemoteTabs)
        chromeWindow.removeEventListener("DOMMouseScroll", this.eventMap.get("DOMMouseScroll-E10S"), true);
      else
        chromeWindow.removeEventListener("DOMMouseScroll", this.eventMap.get("DOMMouseScroll"), true);

      chromeBrowser.removeEventListener("contextmenu", this.eventMap.get("contextmenu"), true);
      chromeBrowser.removeEventListener("mousedown", this.eventMap.get("mousedown"), true);
      chromeBrowser.removeEventListener("mouseup", this.eventMap.get("mouseup"), true);
      chromeBrowser.removeEventListener("keypress", this.eventMap.get("keypress"), true);
      chromeBrowser.tabContainer.removeEventListener("TabAttrModified", this.eventMap.get("tabAttrModified"), true);

      let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);

      let contentAreaContextMenu = aDOMWindow.document.getElementById("contentAreaContextMenu");

      if(contentAreaContextMenu) {
        contentAreaContextMenu.removeEventListener("popupshowing", this.eventMap.get("caContextMenu-ps"), false);
        contentAreaContextMenu.removeEventListener("popupshown", this.eventMap.get("caContextMenu-ps2"), false);
        contentAreaContextMenu.removeEventListener("popuphidden", this.eventMap.get("caContextMenu-ph"), false);
      }
    }
  },

  onTabOpen: function(tab) {
    tab.on("activate", tab => {
      this.setBroadcastCmd("setTabUnselect");
      let worker = this.getWorkerByTab(tab);
      if(worker)
        this.setBBSCmd("setTabSelect", worker );
    });
  },

  winOpen: function(win) {
    this.onWinOpen( viewFor(win) );
  },

  tabOpen: function(tab) {
    this.onTabOpen(tab);
  },

  startListenEvent: function(reason) {
    this.loadPageMod();
    // Init event listener - start
    // 1. Listen open event that windows open before addon startup
    // 2. Listen open event that tabs open before addon startup
    // addon sdk bug :(  see: https://bugzil.la/1196577
    let allWindows = winUtils.windows(null, {includePrivate:true});
    for (let chromeWindow of allWindows) {
      if(winUtils.isBrowser(chromeWindow)) {
        this.onWinOpen( chromeWindow );
        let openedTabs = tabUtils.getTabs( chromeWindow );
        for(let openedTab of openedTabs) {
          this.onTabOpen(modelFor(openedTab));
        }
      }
    }
    // Init event listener - end
  },

  stopListenEvent: function(reason) {
    for(let connection of this.connections) {
        connection.worker.alive = false;
        connection.conn.close();
        connection.worker.destroy();
        if (reason === "disable" || reason === "uninstall") {
          let XulTab = this.geXulTabBytWorker(connection.worker);
          let tab = modelFor(XulTab);
          tab.close();
        }
    }

    // remove all event listener - start
    let allWindows = winUtils.windows(null, {includePrivate:true});
    for (let chromeWindow of allWindows) {
      if(winUtils.isBrowser(chromeWindow)) {
        this.onWinClose( chromeWindow );
      }
    }
    this.pm.destroy();
    // remove all event listener - end
  },

  openPreferencesPage: function() {
    // open XUL windows for preferences page.
    // need porting preferences page to pure HTML later.
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
    let existing = wm.getMostRecentWindow("bbsfox:options");
    if (existing) {
      try{
        existing.focus();
      }
      catch (e) {}
    }
    else {
      ww.openWindow(null, "chrome://bbsfox/content/options.xul", "_blank", "chrome,centerscreen,dialog=no", {wrappedJSObject: {}});
    }

    // TODO: Make options page with HTML
    // see: https://github.com/Noitidart/l10n/tree/html-options

    // open html page in dialog.
    // let optionsDlg = require(data.url("js/optionsDlg.js")).optionsDlg;
    // optionsDlg.open(data.url('html/options.xhtml'));

    // open html page in tab
    // tabs.open({
    //   url: 'chrome://bbsfox/content/options.html',
    //   onOpen: function(tab){
    //     //console.log('onOpen');
    //   },
    //   onReady: function(tab){
    //     //console.log('onReady');
    //   },
    //   onLoad: function(tab){
    //     console.log('onLoad');
    //     tab.title = 'test';
    //   }
    // });
  },

  closePreferencesPage: function() {
    // close preference dialog - start
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
    let existing = wm.getMostRecentWindow("bbsfox:options");
    if (existing){
      try{
        existing.close();
      }
      catch (e) {}
    }
    // close preference dialog - end
  },

  cleanupTempFiles: function() {
    for(let file of this.tempFiles) {
      file.remove(true);
    }
  }

};

exports.bbsfoxPage = bbsfoxPage;
