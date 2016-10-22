"use strict";

const {Cc, Ci} = require("chrome");
let {viewFor} = require("sdk/view/core");
let {modelFor} = require("sdk/model/core");

let tabs = require("sdk/tabs");
let tabUtils = require("sdk/tabs/utils");
let winUtils = require("sdk/window/utils");

let system = require("sdk/system");
let notifications = require("sdk/notifications");
let soundService = Cc["@mozilla.org/sound;1"].createInstance(Ci.nsISound);
let bbsfoxAPI = require("./bbsfox-api.js");

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

  isBBSPage: function(url) {
    //check if this page protocol is telnet/ssh
    return this.urlCheck.test(url);
  },

  handleCoreCommand: function(message) {

    //must make sure command from BBS page.
    let data = message.data;
    switch (data.command) {
      case "updateTabIcon": {
        tabUtils.getTabForBrowser( message.target ).image = message.data.icon;
        break;
      }
      case "openNewTabs":
        this.openNewTabs(data.urls, data.ref, data.charset, data.loadInBg);
        break;
      case "resetStatusBar":
        this.resetStatusBar( message.target );
        break;
      case "updateEventPrefs": {
        tabUtils.getTabForBrowser( message.target ).eventPrefs = data.eventPrefs;
        break;
      }
      case "writePrefs":
        this.writePrefs(data.branchName, data.name, data.vtype, data.value);
        break;
      case "removeStatus": {
        //tabUtils.getTabForBrowser( message.target ).eventPrefs;
        let tab = tabUtils.getTabForBrowser( message.target );
        if(tab) {
          delete tab.eventPrefs;
        }
        break;
      }
      case "frameScriptReady": {
        let xulTab = tabUtils.getTabForBrowser(message.target);
        if(xulTab.selected)
          this.setBBSCmd("setTabSelect", message.target );
        //console.log("handleCoreCommand: frameScriptReady");
        break;
      }
      case "loadAutoLoginInfo":
        this.loadAutoLoginInfo(data.querys, message.target);
        break;
      case "openEasyReadingTab":
        this.openEasyReadingTab(data.htmlData, message.target);
        break;
      case "openFilepicker":
        this.openFilepicker(data, message.target);
        break;
      case "pushThreadDlg":
        this.pushThreadDlg(data, message.target);
        break;
      case "showNotifyMessage":
        this.showNotifyMessage(data, message.target);
        break;
      case "fireNotifySound":
        this.playNotifySound();
        break;
      case "popupVideoWindow":
        this.popupVideoWindow(data.url, message.target);
        break;
      default:
        break;
    }
  },

  resetStatusBar: function(target) {
    let xulTab = tabUtils.getTabForBrowser( target );
    let chromeWindow = tabUtils.getOwnerWindow(xulTab);
    let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
    aDOMWindow.XULBrowserWindow.setOverLink('');
  },

  loadAutoLoginInfo: function(querys, target) {
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
    this.setBBSCmdEx({command: "loginInfoReady", result: result, hostkeys: key_entries}, target);
  },

  openEasyReadingTab: function(htmlData, target) {
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

  pushThreadDlg: function(data, target) {
    let xulTab = tabUtils.getTabForBrowser( target );
    let chromeWindow = tabUtils.getOwnerWindow(xulTab);
    let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);

    let EMURL = "chrome://bbsfox/content/pushThread.xul";
    let EMFEATURES = "chrome, dialog=yes, resizable=yes, modal=yes, centerscreen";
    let retVals = { exec: false, pushText: data.pushText, lineLength: data.lineLength};
    let retVals2 = [];
    aDOMWindow.openDialog(EMURL, "", EMFEATURES, retVals, retVals2);
    if(retVals.exec) {
      this.setBBSCmdEx({command:"sendPushThreadText",
                        sendText:retVals2,
                        temp:""
                      }, target);
    }
    else {
      this.setBBSCmdEx({command:"sendPushThreadText",
                        temp: retVals.pushText
                      }, target);
    }
  },

  showNotifyMessage: function(data, target){
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
        this.setTabFocus(target);
        if(data.replyString) {
          this.setBBSCmdEx({command:"sendText", text: data.replyString}, target);
        }
      }
    }
    notifications.notify(msg);
  },

  popupVideoWindow: function(url, target) {
    let xulTab = tabUtils.getTabForBrowser( target );
    let chromeWindow = tabUtils.getOwnerWindow(xulTab);
    let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
    if(aDOMWindow.PopupVideo_API)
      aDOMWindow.PopupVideo_API.popupVideo(url);
  },

  playNotifySound: function(){
    if(soundService) {
      soundService.beep();
    }
  },

  setTabFocus: function(target) {
    let xulTab = tabUtils.getTabForBrowser( target );
    tabUtils.activateTab(xulTab, tabUtils.getOwnerWindow(xulTab));
  },

  openFilepicker: function(data, target) {
    let xulTab = tabUtils.getTabForBrowser( target );
    let chromeWindow = tabUtils.getOwnerWindow(xulTab);
    let aDOMWindow = chromeWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);

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
            this.setBBSCmdEx({command: postCommand, fileData: bytes}, target);
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

  setBBSCmdEx: function(commandSet, target) {
    if(!target) {
      let tab = tabs.activeTab;
      if(this.isBBSPage(tab.url)) { // telnet:// or ssh://
        let xulTab = tabUtils.getTabForId(tab.id);
        target = tabUtils.getBrowserForTab(xulTab);
      }
    }
    if(target) {
      let browserMM = target.messageManager;
      browserMM.sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", commandSet);
    }
  },

  setBBSCmd: function(command, target) {
    if(!target) {
      let tab = tabs.activeTab;
      if(tab && this.isBBSPage(tab.url)) { // telnet:// or ssh://
        let xulTab = tabUtils.getTabForId(tab.id);
        target = tabUtils.getBrowserForTab(xulTab);
      }
    }
    if(target) {
      let browserMM = target.messageManager;
      browserMM.sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", {command: command});
    }
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

    //console.log(event.target);
    let eventPrefs = tab.eventPrefs;
    if(!eventPrefs) {
      return;
    }

    let browser = e10s ? event.target.mCurrentBrowser : null;

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
        this.setBBSCmd(action, browser);
        event.stopPropagation();
        event.preventDefault();

        if(this.mouseRBtnDown) {//prevent context menu popup
          this.doDOMMouseScroll = true;
        }
        if(this.mouseLBtnDown) {
          //TODO: fix this, tell content page skip this mouse click.
          if(eventPrefs.useMouseBrowsing) {
            this.setBBSCmd("skipMouseClick", browser);
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
    //let uri = tabUtils.getURI(tab);
    this.handle_mouse_scroll({event: event, tab: tab, e10s:true});
  },

  mouse_scroll: function (event) {
    let tab = tabs.activeTab;
    let xulTab = tabUtils.getTabForId(tab.id);

    //tabUtils.getTabForBrowser( message.target ).eventPrefs = data.eventPrefs;
    //console.log(xulTab.eventPrefs);
    this.handle_mouse_scroll({event: event, tab: xulTab, e10s:false});
  },

  mouse_menu: function (event) {
    let tab = tabs.activeTab;
    let xulTab = tabUtils.getTabForId(tab.id);
    //let tab = event.target.mCurrentTab;
    let uri = tabUtils.getURI(xulTab);
    if(!this.isBBSPage(uri))
      return;

    let eventPrefs = xulTab.eventPrefs;
    if(!eventPrefs)
      return;

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
    let xulTab = tabUtils.getTabForId(tab.id);
    let uri = tabUtils.getURI(xulTab);
    if(!this.isBBSPage(uri))
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
    let xulTab = tabUtils.getTabForId(tab.id);
    let uri = tabUtils.getURI(xulTab);
    if(!this.isBBSPage(uri))
      return;

    let eventPrefs = xulTab.eventPrefs;
    if(!eventPrefs)
      return;

    let mouseWheelFunc2 = (eventPrefs.mouseWheelFunc2 != 0);
    if(mouseWheelFunc2) {
      if(event.button==2) {
        if(this.os == "winnt") {
          //do nothing...
        }
        else {//if Linux or Mac, show popup menu.
          if(!this.doDOMMouseScroll) {
            let browser = event.target.mCurrentBrowser;
            this.setBBSCmdEx({command:"contextmenu",
                              screenX:event.screenX,
                              screenY:event.screenY,
                              clientX:event.clientX,
                              clientY:event.clientY}, browser);

          }
        }
      }
    }
  },

  key_press: function (event) {

    let tab = tabs.activeTab;
    let xulTab = tabUtils.getTabForId(tab.id);
    let eventPrefs = xulTab.eventPrefs;
    if(!eventPrefs || !eventPrefs.keyEventStatus)
      return;

    let uri = tabUtils.getURI(xulTab);
    if(!this.isBBSPage(uri))
      return;

    let browser = event.target.mCurrentBrowser;

    if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch(event.keyCode) {
        case 33: //Page Up
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doPageUp", browser);
          return;
        case 34: //Page Down
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doPageDown", browser);
          return;
        case 38: //Arrow Up
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doArrowUp", browser);
          return;
        case 40: //Arrow Down
          event.stopPropagation();
          event.preventDefault();
          this.setBBSCmd("doArrowDown", browser);
          return;
        default:
          break;
      }
    }
    if(event.charCode){
      if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 118 || event.charCode == 86) && eventPrefs.hokeyForPaste) { //Shift + ^V, do paste
        this.setBBSCmd("doPaste", browser);
        event.preventDefault();
        event.stopPropagation();
      }

      if (event.ctrlKey && !event.altKey && !event.shiftKey) {
        if((event.charCode==109 || event.charCode==77) && eventPrefs.hokeyForMouseBrowsing) {
          this.setBBSCmd("switchMouseBrowsing", browser);
          event.stopPropagation();
          event.preventDefault();
        }
        if(this.os != "darwin") {
          if((event.charCode==119 || event.charCode==87) && eventPrefs.hotkeyCtrlW == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:23}, browser);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==98 || event.charCode==66) && eventPrefs.hotkeyCtrlB == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:2}, browser);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==108 || event.charCode==76) && eventPrefs.hotkeyCtrlL == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:12}, browser);
            event.stopPropagation();
            event.preventDefault();
          }
          else if((event.charCode==116 || event.charCode==84) && eventPrefs.hotkeyCtrlT == 1) {
            this.setBBSCmdEx({command:"sendCharCode", charCode:20}, browser);
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
    let tabId = tab.id;
    let xulTab = tabUtils.getTabForId(tabId);
    if(this.isBBSPage(tab.url)) {
      let eventPrefs = xulTab.eventPrefs;
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
    //let tabId = tabUtils.getTabId(event.target);
    let tabBrowser = tabUtils.getBrowserForTab(event.target);
    let browserMM = tabBrowser.messageManager;
    browserMM.sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayEvent", {command:"update"});
    this.setBBSCmd("updateCursor");
  },

  init: function() {
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
      aDOMWindow.messageManager.addMessageListener("bbsfox@ettoolong:bbsfox-coreCommand",  this.eventMap.get("handleCoreCommand") );
      aDOMWindow.messageManager.loadFrameScript("chrome://bbsfox/content/bbsfox_frame_script.js", true);

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
      aDOMWindow.messageManager.removeDelayedFrameScript("chrome://bbsfox/content/bbsfox_frame_script.js");
      aDOMWindow.messageManager.removeMessageListener("bbsfox@ettoolong:bbsfox-coreCommand",  this.eventMap.get("handleCoreCommand") );

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
      Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageBroadcaster)
        .broadcastAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", {command: "setTabUnselect"});
      let tabId = tab.id;
      let xulTab = tabUtils.getTabForId(tabId);
      let tabBrowser = tabUtils.getBrowserForTab(xulTab);
      this.setBBSCmd("setTabSelect", tabBrowser );
    });
  },

  winOpen: function(win) {
    this.onWinOpen( viewFor(win) );
  },

  tabOpen: function(tab) {
    this.onTabOpen(tab);
  },

  unloadTab: function(xulTab) {
    let url = modelFor(xulTab).url;
    if(this.isBBSPage(url)) {
      let target = tabUtils.getBrowserForTab(xulTab);
      this.setBBSCmd("unload", target);
    }
  },

  startListenEvent: function(reason) {
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
          //console.log(openedTabs[i]);
          this.onTabOpen(modelFor(openedTab));
        }
      }
    }
    // Init event listener - end
  },

  stopListenEvent: function(reason) {
    // remove all event listener - start
    let allWindows = winUtils.windows(null, {includePrivate:true});
    for (let chromeWindow of allWindows) {
      if(winUtils.isBrowser(chromeWindow)) {
        if (reason === "disable" || reason === "uninstall") {
          let openedTabs = tabUtils.getTabs( chromeWindow );
          for(let openedTab of openedTabs) {
            this.unloadTab(openedTab);
          }
        }
        this.onWinClose( chromeWindow );
      }
    }
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

  sendAddonEvent: function(event) {
    Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageBroadcaster)
      .broadcastAsyncMessage("bbsfox@ettoolong:bbsfox-addonCommand", {command: event});
  },

  cleanupTempFiles: function() {
    for(let file of this.tempFiles) {
      file.remove(true);
    }
  }

};

exports.bbsfoxPage = bbsfoxPage;
