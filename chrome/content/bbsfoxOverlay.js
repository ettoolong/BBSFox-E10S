var ETT_BBSFOX_Overlay =
{
  //youtube url :
  //http://youtu.be/XXXXXXXXXX
  //http://www.youtube.com/watch?v=XXXXXXXXXX
  //http://m.youtube.com/watch?v=XXXXXXXXXX
  vtRegex: /((https?:\/\/www\.youtube\.com\/watch\?.*(v=[A-Za-z0-9._%-]*))|(https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*))|(https?:\/\/m\.youtube\.com\/watch\?.*(v=[A-Za-z0-9._%-]*)))/i,
  vtRegex2: /(http:\/\/www\.ustream\.tv\/(channel|channel-popup)\/([A-Za-z0-9._%-]*))/i,
  vtRegex3: /(http:\/\/www\.ustream\.tv\/recorded\/([0-9]{5,10}))/i,
//  urlCheck : /(^(telnet|ssh):\/\/)/i,
//  Name : 'BBSFox overlay',
//  BBSFoxVersion : "2.0.0",
//  FXVersion: 3.6,
  ReplyRobotActive: false,
  ellipsis : "\u2026",
  consoleService: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  ioService : Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),

  init: function() {
    //var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    //this.FXVersion = parseFloat(appInfo.version);
    var eventMap = new Map();
    this.eventMap = eventMap;
    //add event to map - start
    eventMap.set('caContextMenu-ps', this.bbsfoxContextMenuShowing.bind(this));
    eventMap.set('caContextMenu-ph', this.bbsfoxContextMenuHidden.bind(this));
    eventMap.set('appmenu-popup-ps', this.bbsfoxAppMenuShowing.bind(this));
    eventMap.set('panelUI-popup-ps', this.bbsfoxPuiMenuShowing.bind(this));
    eventMap.set('view-menu-ps', this.bbsfoxViewMenuShowing.bind(this));
    eventMap.set('tabAttrModified', this.tabAttrModified.bind(this));
    eventMap.set('tabSelect', this.tabSelect.bind(this));
    eventMap.set('cmd_savePage', this.cmdSavePage.bind(this));
    eventMap.set('cmd_paste', this.cmdPaste.bind(this));
    eventMap.set('cmd_copy', this.cmdCopy.bind(this));
    eventMap.set('cmd_selectAll', this.cmdSelectAll.bind(this));
    //add event to map - end

    //add event listener - start
    document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', eventMap.get('caContextMenu-ps'), false);
    document.getElementById('contentAreaContextMenu').addEventListener('popuphidden', eventMap.get('caContextMenu-ph'), false);
    var appmenu = document.getElementById('appmenu-popup');
    if(appmenu) appmenu.addEventListener('popupshowing', eventMap.get('appmenu-popup-ps'), false);
    var puimenu = document.getElementById('PanelUI-popup');
    if(puimenu) puimenu.addEventListener('popupshowing', eventMap.get('panelUI-popup-ps'), false);
    var viewmenu = document.getElementById('view-menu');
    if(viewmenu) viewmenu.addEventListener('popupshowing', eventMap.get('view-menu-ps'), false);
    gBrowser.tabContainer.addEventListener('TabAttrModified', eventMap.get('tabAttrModified'), true);
    gBrowser.tabContainer.addEventListener('TabSelect', eventMap.get('tabSelect'), false);
    document.getElementById('Browser:SavePage').addEventListener('command', eventMap.get('cmd_savePage'), true);
    document.getElementById('cmd_paste').addEventListener('command', eventMap.get('cmd_paste'), true);
    document.getElementById('cmd_copy').addEventListener('command', eventMap.get('cmd_copy'), true);
    document.getElementById('cmd_selectAll').addEventListener('command', eventMap.get('cmd_selectAll'), true);
    //add event listener - end

    this.EventHandler.init(this);

    try {
      this.ellipsis = gPrefService.getComplexValue("intl.ellipsis", Components.interfaces.nsIPrefLocalizedString).data;
    } catch (e) { }
  },

  release: function() {
    this.EventHandler.release();

    //remove event listener - start
    var eventMap = this.eventMap;
    gBrowser.tabContainer.removeEventListener('TabSelect', eventMap.get('tabSelect'), false);
    gBrowser.tabContainer.removeEventListener('TabAttrModified', eventMap.get('tabAttrModified'), true);
    var viewmenu = document.getElementById('view-menu');
    if(viewmenu) viewmenu.removeEventListener('popupshowing', eventMap.get('view-menu-ps'), false);
    var puimenu = document.getElementById('PanelUI-popup');
    if(puimenu) puimenu.removeEventListener('popupshowing', eventMap.get('panelUI-popup-ps'), false);
    var appmenu = document.getElementById('appmenu-popup');
    if(appmenu) appmenu.removeEventListener('popupshowing', eventMap.get('appmenu-popup-ps'), false);
    document.getElementById('contentAreaContextMenu').removeEventListener('popuphidden', eventMap.get('caContextMenu-ph'), false);
    document.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', eventMap.get('caContextMenu-ps'), false);
    document.getElementById('Browser:SavePage').removeEventListener('command', eventMap.get('cmd_savePage'), true);
    document.getElementById('cmd_paste').removeEventListener('command', eventMap.get('cmd_paste'), true);
    document.getElementById('cmd_copy').removeEventListener('command', eventMap.get('cmd_copy'), true);
    document.getElementById('cmd_selectAll').removeEventListener('command', eventMap.get('cmd_selectAll'), true);
    //remove event listener - end
  },

  coreCommand: function(message) {
    var data = message.data;
    switch (data.command) {
      case "updateOverlayPrefs":
        gBrowser.getTabForBrowser( message.target ).overlayPrefs = data.overlayPrefs;
        break;
      case "updateEventPrefs":
        gBrowser.getTabForBrowser( message.target ).eventPrefs = data.eventPrefs;
        break;
      case "removePrefs":
        if(gBrowser.getTabForBrowser( message.target ).eventPrefs)
          delete gBrowser.getTabForBrowser( message.target ).eventPrefs;
        if(gBrowser.getTabForBrowser( message.target ).overlayPrefs)
          delete gBrowser.getTabForBrowser( message.target ).overlayPrefs;
        gBrowser.getTabForBrowser( message.target ).eventStatus = {
          doDOMMouseScroll: false
        };
        break;
      case "updateTabIcon":
        gBrowser.getTabForBrowser( message.target ).image = message.data.icon;
        break;
      case "openNewTabs":
        this.openNewTabs(data.urls, data.ref, data.charset, data.loadInBg);
        //gBrowser.loadOneTab(url, null, charset, null, true, false);
        //openNewTabs: function(urls, ref, charset, loadInBg) {
        break;
      case "resetStatusBar":
        XULBrowserWindow.setOverLink("");
        break;
      case "writePrefs":
        this.writePrefs(data.branchName, data.name, data.vtype, data.value);
        break;
      case "openFilepicker":
        this.openFilepicker(data.title, data.mode, data.defaultExtension, data.defaultString, data.appendFilters, data.saveData, data.convertUTF8);
        break;
      case "setTabFocus":
        //var tab = gBrowser.getTabForBrowser( message.target );
        //TODO: set tab focus.
        break;
      default:
        break;
    }
  },

  getOverlayPrefs: function() {
    //items in contentAreaContextMenu
    return gBrowser.mCurrentTab.overlayPrefs;
  },

  getEventPrefs: function() {
    //mouse and hotkey setting
    return gBrowser.mCurrentTab.eventPrefs;
  },

  getEventStatus: function() {
    //status
    return gBrowser.mCurrentTab.eventStatus;
  },

  isOnBBSPage: function() {
    if(gBrowser.mCurrentTab.overlayPrefs)
      return gBrowser.mCurrentTab.overlayPrefs.result;
    return false;
    //return gBrowser.selectedBrowser.contentDocumentAsCPOW.defaultView.bbsfox;
  },

  setItemVisible: function(id, visible, checkHidden) {
    let menuitem = document.getElementById(id);
    if(menuitem) {
      if(checkHidden)
        menuitem.hidden = (menuitem.hidden || !visible);
      else
        menuitem.hidden = !visible;
    }
  },

  setItemEnable: function(id, enable) {
    let menuitem = document.getElementById(id);
    if(menuitem)
      menuitem.disabled = !enable;
  },

  bbsfoxViewMenuShowing: function(e) {
    //handle firefox main menu -> view popup items
    if(this.isOnBBSPage()) {
      this.setItemVisible("viewFullZoomMenu", false);
      this.setItemVisible("charsetMenu", false);
      this.setItemVisible("menu_pageSource", false);
    } else {
      this.setItemVisible("viewFullZoomMenu", true);
      this.setItemVisible("charsetMenu", true);
      this.setItemVisible("menu_pageSource", true);
    }
  },

  bbsfoxPuiMenuShowing: function(event) {
    //handle firefox panelUI-popup items
    if(this.isOnBBSPage()) {
      //this.setItemVisible("zoom-controls", false); ////hide button
      this.setItemEnable("zoom-out-button", false);
      this.setItemEnable("zoom-reset-button", true);
      this.setItemEnable("zoom-in-button", false);
      this.setItemEnable("cut-button", false);
    } else {
      //this.setItemVisible("zoom-controls", true); ////hide button
      this.setItemEnable("zoom-out-button", true);
      this.setItemEnable("zoom-reset-button", true);
      this.setItemEnable("zoom-in-button", true);
    }
  },

  bbsfoxAppMenuShowing: function(e) {
    //handle firefox app menu items
    if(this.isOnBBSPage()) {
      this.setItemVisible("appmenu_developer_charsetMenu", false);
      this.setItemVisible("appmenu_charsetMenu", false);
    } else {
      this.setItemVisible("appmenu_developer_charsetMenu", true);
      this.setItemVisible("appmenu_charsetMenu", true);
    }
  },

  bbsfoxContextMenuShowing: function(event) {

    var isNowBBSPage = this.isOnBBSPage();
    var prefs = this.getOverlayPrefs();

    if (event.originalTarget == document.getElementById("contentAreaContextMenu")) {
    } else {
      if(isNowBBSPage && prefs && prefs.result)
        this.hideHtmlMenuItem(prefs);
      return;
    }
    if (!gContextMenu) return;

    if(isNowBBSPage && prefs && prefs.result)
    {
      var eventStatus = this.getEventStatus();
      if(eventStatus)
        eventStatus.resetFocus = true;
      var contextMenuInfo = this.getContextMenuInfo();

      this.hideHtmlMenuItem(prefs);

      this.setItemVisible("ietab-viewpage", false);//for coral ie-tab / ie-tab plus add-on
      this.setItemVisible("ietab-viewpage-sep", false);//for coral ie-tab / ie-tab plus add-on

      this.setItemVisible("ietab2-viewpage", false);//for ie-tab2 add-on
      this.setItemVisible("ietab2-viewpage-extapp", false);//for ie-tab2 add-on
      this.setItemVisible("ietab2-viewpage-sep", false);//for ie-tab2 add-on

      this.setItemVisible("dwhelper-ctxmenu", false);//for DownloadHelper add-on
      this.setItemVisible("dwhelper-snmenu", false);//for DownloadHelper add-on

      //this.setItemVisible("tongwen-context-menu", false);//for new tong wen tang add-on

      if(!prefs.isOnPicWindow)
      {
        //bbsfox menu - start
        if(prefs.embeddedPlayerMenu)
        {
          var showEmbeddedPlayerItem = false;
          var urltemp = contextMenuInfo.linkURL;
          if(contextMenuInfo.isOnLink) {
            if( this.vtRegex.test(urltemp) ) {
              eventStatus.videoType = 'Y';
              eventStatus.videoUrl = urltemp;
              showEmbeddedPlayerItem = true;
            } else if( this.vtRegex2.test(urltemp) ) {
              eventStatus.videoType = 'U';
              eventStatus.videoUrl = urltemp;
              showEmbeddedPlayerItem = true;
            } else if( this.vtRegex3.test(urltemp) ) {
              eventStatus.videoType = 'R';
              eventStatus.videoUrl = urltemp;
              showEmbeddedPlayerItem = true;
            }
          }
          this.setItemVisible("bbsfox_menu-embeddedPlayer", showEmbeddedPlayerItem);

        } else {
          this.setItemVisible("bbsfox_menu-embeddedPlayer", false);
        }

        if(!contextMenuInfo.isTextSelected) // not select anything
        {
          this.setItemVisible("bbsfox_menu-addTrack", false);
          this.setItemVisible("bbsfox_menu-delTrack", false);
        }
        else // have select something
        {
          if(prefs.useKeyWordTrack && prefs.keyWordTrackMenu)
          {
            var selstr = contextMenuInfo.selectedText;
            var strArray = selstr.split('\r\n');
            if(strArray.length>1 || strArray.length<1) //select text include \r\n
            {
              this.setItemVisible("bbsfox_menu-addTrack", false);
              this.setItemVisible("bbsfox_menu-delTrack", false);
            }
            else
            {
              selstr = this.trim_right(strArray[0]);
              var findflag = false;

              for (var i = 0; prefs.keywords && i < prefs.keywords.length; i++) {
                if (prefs.keywords[i] == selstr){
                  findflag = true;
                  break;
                }
              }
              if(findflag) // select text already in track list
              {
                this.setItemVisible("bbsfox_menu-addTrack", false);
                this.setItemVisible("bbsfox_menu-delTrack", true);
              }
              else
              {
                this.setItemVisible("bbsfox_menu-addTrack", true);
                this.setItemVisible("bbsfox_menu-delTrack", false);
              }
            }
          }//if(useKeyWordTrack)
          else
          {
            this.setItemVisible("bbsfox_menu-addTrack", false);
            this.setItemVisible("bbsfox_menu-delTrack", false);
          }
        }
        this.setItemVisible("bbsfox_menu-ansiCopy", contextMenuInfo.isTextSelected && prefs.ansiCopyMenu);
        this.setItemVisible("bbsfox_menu-clearTrack", prefs.useKeyWordTrack && prefs.keyWordTrackMenu && prefs.keywords && prefs.keywords.kength);

        this.setItemVisible("context-paste", true);
        //this.setItemVisible("context-selectall", false);
        this.setItemEnable("context-selectall", true);    //TODO: need fix, it still disable :(
        var pasteCmd = !(document.getElementById("context-paste").disabled);
        this.setItemVisible("bbsfox_menu-delayPaste", prefs.delayPasteMenu && pasteCmd); //check clipboard first ?

        this.setItemVisible("bbsfox_menu-copyHtml", prefs.copyHtmlMenu);
        this.setItemVisible("bbsfox_menu-screenKeyboard", !contextMenuInfo.isTextSelected && prefs.screenKeyboardMenu && !prefs.screenKeyboardOpened );
        this.setItemVisible("bbsfox_menu-openAllLink", !contextMenuInfo.isTextSelected && prefs.openAllLinkMenu && prefs.haveLink );

        var isPicLink = !(contextMenuInfo.linkURL.search(/\.(bmp|gif|jpe?g|png)$/i) == -1);
        this.setItemVisible("bbsfox_menu-previewPicture", prefs.previewPictureMenu && isPicLink);
        eventStatus.pictureUrl = contextMenuInfo.linkURL;

        this.setItemVisible("bbsfox_menu-easyRead", !contextMenuInfo.isTextSelected && prefs.easyReadingMenu);
        this.setItemVisible("bbsfox_menu-pushThread", !contextMenuInfo.isTextSelected && prefs.pushThreadMenu);
        this.setItemVisible("bbsfox_menu-openThreadUrl", !contextMenuInfo.isTextSelected && prefs.openThreadUrlMenu);
        this.setItemVisible("bbsfox_menu-changeColorTable", !contextMenuInfo.isTextSelected && prefs.changeColorTableMenu);
        this.setItemVisible("bbsfox_menu-changeColorTable", !contextMenuInfo.isTextSelected && prefs.downloadPostMenu);
        this.setItemVisible("bbsfox_menu-fileIo", !contextMenuInfo.isTextSelected && prefs.fileIoMenu);
        this.setItemVisible("bbsfox_menu-mouseBrowsing", !contextMenuInfo.isTextSelected && prefs.mouseBrowseMenu);
        this.setItemVisible("bbsfox_menu-BgDisplay", !contextMenuInfo.isTextSelected && prefs.switchBgDisplayMenu && prefs.enableBackground);
        this.setItemVisible("bbsfox_menu-addToBlacklist", contextMenuInfo.isTextSelected && prefs.blacklistMenu && prefs.addToBlacklist);
        this.setItemVisible("bbsfox_menu-removeFromBlacklist", contextMenuInfo.isTextSelected && prefs.blacklistMenu && prefs.removeFromBlacklist);
        //bbsfox menu - end
      }
      else
      {
        this.setItemVisible("context-viewimage", true);
        this.hidebbsfoxMenuItem();
      }
    }
    else
    {
      var dwhelperContextMenu = false;
      try {
        var dwhprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("dwhelper.");
        if(dwhprefs)
          dwhelperContextMenu = dwhprefs.getBoolPref('context-menu');
      } catch(ex) {}

      if(dwhelperContextMenu) {
        this.setItemVisible("dwhelper-ctxmenu", true);//for DownloadHelper add-on
        this.setItemVisible("dwhelper-snmenu", true);//for DownloadHelper add-on
      }
      this.showHtmlMenuItem();
      this.hidebbsfoxMenuItem();
    }
  },

  bbsfoxContextMenuHidden: function(event) {
    if(this.isOnBBSPage()) {
      if(event.target == document.getElementById("contentAreaContextMenu")) {
        var eventStatus = this.getEventStatus();
        if(eventStatus && eventStatus.resetFocus) {
          this.setBBSCmd("setInputAreaFocus");
        }
      }
    }
  },
///////////////////////
  hideHtmlMenuItem: function(prefs) {
    this.setItemVisible("context-savepage", prefs.savePageMenu, true);
    this.setItemVisible("context-viewimage", false);

    this.setItemVisible("context-viewbgimage", false);
    this.setItemVisible("context-sep-viewbgimage", false);
    this.setItemVisible("context-back", false);
    this.setItemVisible("context-forward", false);
    this.setItemVisible("context-reload", false);
    this.setItemVisible("context-stop", false);

    this.setItemVisible("context-sep-stop", false);
    this.setItemVisible("context-viewpartialsource-selection", false);
    this.setItemVisible("context-viewpartialsource-mathml", false);
    this.setItemVisible("context-viewsource", false);

    //hide some item in option - start
    if(prefs.hideBookMarkPage)
      this.setItemVisible("context-bookmarklink", false);
    if(prefs.hideSendLink)
      this.setItemVisible("context-sendlink", false);
    if(prefs.hideBookMarkPage)
      this.setItemVisible("context-bookmarkpage", false);
    if(prefs.hideSendPage)
      this.setItemVisible("context-sendpage", false);
    if(prefs.hideViewInfo) {
      this.setItemVisible("context-sep-viewsource", false);
      this.setItemVisible("context-viewinfo", false);
    }
    if(prefs.hideInspect){
      this.setItemVisible("inspect-separator", false);
      this.setItemVisible("context-inspect", false);
    }
    //hide some item in option - end
  },

  showHtmlMenuItem: function() {
    this.setItemVisible("context-back", true);
    this.setItemVisible("context-forward", true);
  },

  hidebbsfoxMenuItem: function() {
      let items = ["bbsfox_menu-ansiCopy", "bbsfox_menu-addTrack", "bbsfox_menu-delTrack",
                   "bbsfox_menu-clearTrack", "bbsfox_menu-delayPaste", "bbsfox_menu-copyHtml",
                   "bbsfox_menu-screenKeyboard" ,"bbsfox_menu-embeddedPlayer", "bbsfox_menu-previewPicture",
                   "bbsfox_menu-openAllLink", "bbsfox_menu-easyRead", "bbsfox_menu-downloadPost",
                   "bbsfox_menu-fileIo", "bbsfox_menu-mouseBrowsing", "bbsfox_menu-BgDisplay",
                   "bbsfox_menu-pushThread", "bbsfox_menu-openThreadUrl", "bbsfox_menu-changeColorTable",
                   "bbsfox_menu-addToBlacklist", "bbsfox_menu-removeFromBlacklist"];
      let itemsLength = items.length;
      for(let i = 0;i<itemsLength;++i) {
        this.setItemVisible(items[i], false);
      }
  },

  viewimage: function(event) {
    if(this.isOnBBSPage()) {
      //TODO: open image in new tab
    } else {
      gContextMenu.viewMedia(event);
    }
  },

  openLinkInCurrent: function() {
    if(this.isOnBBSPage()) {
      gContextMenu.openLinkInTab();
    } else {
      gContextMenu.openLinkInCurrent();
    }
  },

  savePageAs: function() {
    if(this.isOnBBSPage()) {
      this.savePage();
    } else {
      gContextMenu.savePageAs();
    }
  },

  getContextMenuInfo: function() {

    if(gContextMenu) {
      return {
        isTextSelected: gContextMenu.isTextSelected,
        isOnLink: gContextMenu.onLink,
        selectedText: gContextMenu.textSelected,
        linkURL: gContextMenu.linkURL
      };

    } else {
      return null;
    }
  },

  tabSelect : function (event) {
    if(event.target.overlayPrefs)
      this.setBBSCmd("setInputAreaFocus");
  },

  tabAttrModified : function (event) {
    document.defaultView.gBrowser.selectedBrowser.messageManager
    .sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayEvent", {event:"tabAttrModified"});

    if(event.target.overlayPrefs)
      event.target.image = event.target.overlayPrefs.tabIcon;
  },

  setBBSCmd: function(command) {
    //browserMM
    document.defaultView.gBrowser.selectedBrowser.messageManager
    .sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", {command:command});
  },
  setBBSCmdEx: function(commandSet) {
    //browserMM
    document.defaultView.gBrowser.selectedBrowser.messageManager
    .sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", commandSet);
  },

  writePrefs: function(branchName, name, vtype, value) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefService)
               .getBranch(branchName);
    if(vtype == Components.interfaces.nsIPrefBranch.PREF_BOOL) {
      prefs.getBoolPref(name, value);
    }
    else if(vtype == Components.interfaces.nsIPrefBranch.PREF_INT) {
      prefs.setIntPref(name, value);
    }
    else if(vtype == Components.interfaces.nsIPrefBranch.PREF_STRING) {
      var nsIString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
      nsIString.data = value;
      prefs.setComplexValue(name, Components.interfaces.nsISupportsString, nsIString);
    }
  },

  openFilepicker: function(title, mode, extension, defaultStr, filters, data, convertUTF8) {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fileChooser = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      fileChooser.init(window, title, mode);

      fileChooser.defaultExtension = extension;
      fileChooser.defaultString = defaultStr;
      for(var i=0;i<filters.length;++i)
        fileChooser.appendFilters(filters[i]);
      fileChooser.open(function(result) {
        //returnOK        0
        //returnCancel    1
        //returnReplace   2
        if (result != nsIFilePicker.returnCancel) {
          // file is nsIFile, data is a string
          var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
          if(fileChooser.file.exists()){
            fileChooser.file.remove(true);
          }
          fileChooser.file.create(fileChooser.file.NORMAL_FILE_TYPE, 0666);
          foStream.init(fileChooser.file, 0x02 | 0x08 | 0x20, 0666, null);
          if(convertUTF8) {
            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
            converter.init(foStream, "UTF-8", 0, 0);
            converter.writeString(data);
            converter.close(); // this closes foStream
          } else {
            foStream.write(data, data.length);
            if (foStream instanceof Components.interfaces.nsISafeOutputStream)
              foStream.finish();
            else
              foStream.close();
          }
        }
      });
  },

  getPrefs: function() {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefService)
               .getBranch("extensions.bbsfox2.");
    return prefs;
  },

  trim_left: function(str) {
    return str.replace(/^\s+/,'');
  },

  trim_right: function(str) {
    return this.replace(/\s+$/,'');
  },

  trim_both: function(str) {
    return str.replace(/^\s+|\s+$/g,'');
  },

  openURL: function(aURL) {
    this.openNewTabs(aURL, null, null, false);
  },

  setVersion: function(addon) {
    var prefs = this.getPrefs();
    var lastVersion = prefs.getComplexValue("Version", Components.interfaces.nsISupportsString).data;
    this.BBSFoxVersion = addon.version;
    var showVersionHistory = prefs.getBoolPref("ShowVersionHistory");
    //ETT_BBSFOX_Overlay.dempDebugMessage('BBSFoxVersion='+ETT_BBSFOX_Overlay.BBSFoxVersion);
    if(this.BBSFoxVersion != lastVersion) {
      var sString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
      sString.data = this.BBSFoxVersion;
      prefs.setComplexValue("Version", Components.interfaces.nsISupportsString, sString);
      if(showVersionHistory)
        this.openURL('chrome://bbsfox/locale/history.htm');
      this.cleanupOldPref();
    }
  },
  checkReplyRobotActive: function(addon) {
    if(addon)
      this.ReplyRobotActive = addon.isActive;
  },

  checkVerion: function() {
    var prefs = this.getPrefs();
    var lastVersion = prefs.getComplexValue("Version", Components.interfaces.nsISupportsString).data;

    if(lastVersion=="1.0.0")//first install, show help file
      this.openURL('chrome://bbsfox/locale/help.htm');
    try {
        // Firefox 4 and later; Mozilla 2 and later
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID("{86095750-AD15-46d8-BF32-C0789F7E6A32}", this.setVersion.bind(this));
    } catch(ex){}

    try {
        // Firefox 4 and later; Mozilla 2 and later
        AddonManager.getAddonByID("ReplyRobot@ettoolong", this.checkReplyRobotActive.bind(this));
    } catch(ex){}
  },
  cleanupOldPref: function() {
    //we remove preferences that only use in old version BBSFox (BBSFox 1.0.0 ~ BBSFox 1.0.80).
    var globalPrefs = [];
    var sitePrefs   = ['UseMouseSwitchPage','UseMouseUpDown','UseMouseReadThread','MiddleButtonSendEnter','LoadUrlInBackGround','Login','Passwd','NotifyWhenBackbround','SaveAfterDownload','bbsbox.fontFitWindowWidth'];
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    try{prefs.getBranch('extensions.bbsfox.').deleteBranch('');}catch(ex){}

    for(var i in globalPrefs){
      try{prefs.deleteBranch('extensions.bbsfox2.'+globalPrefs[i]);}catch(ex){}
    }

    var siteIDs = prefs.getBranch('extensions.bbsfox2.hostlist_').getChildList("", { });
    for(var j=0; j<siteIDs.length; ++j) {
      for(var k in sitePrefs){
        try{prefs.deleteBranch('extensions.bbsfox2.host_default.'+sitePrefs[k]);}catch(ex){}
        try{prefs.deleteBranch('extensions.bbsfox2.host_'+siteIDs[j]+'.'+sitePrefs[k]);}catch(ex){}
      }
    }
  },

  dumpDebugMessage: function(msg) {
    /* another way to do this (use FUEL).
    this.application.console.log("BBSFox: " + msg);
    this.application.console.open(); //auto open error console
    */
    this.consoleService.logStringMessage("BBSFox: " + msg);
  },

  dumpErrorMessage: function(msg) {
    /*another way to do this.
    Components.utils.reportError("BBSFox: " + msg); //
    */
    this.dempLogToConsole("BBSFox: " + msg, null, null, null, Components.interfaces.nsIScriptError.errorFlag, '');
  },

  dumpLogToConsole: function(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory)
  {
    //https://developer.mozilla.org/en/nsIConsoleService
    /*
    aFlags:
      nsIScriptError.errorFlag = 0
      nsIScriptError.warningFlag = 1
      nsIScriptError.exceptionFlag = 2
      nsIScriptError.strictFlag = 4
    */
    var scriptError = Components.classes["@mozilla.org/scripterror;1"].createInstance(Components.interfaces.nsIScriptError);
    scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
    this.consoleService.logMessage(scriptError);
  },

  openNewTabs: function(urls, ref, charset, loadInBg) {
    //https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/loadOneTab
    //loadOneTab( URL, referrerURI, charset, postData, loadInBackground, allowThirdPartyFixup )
    for(var i=0;i<urls.length;++i) {
      gBrowser.loadOneTab(urls[i], ref, charset, null, loadInBg, false);
    }
  },

  addTrack: function() {
    this.setBBSCmd("doAddTrack");
  },

  delTrack: function() {
    this.setBBSCmd("doDelTrack");
  },

  clearTrack: function() {
    this.setBBSCmd("doClearTrack");
  },

  copyText: function() {
    this.setBBSCmd("doCopy");
  },

  copyAnsi: function() {
    var eventStatus = this.getEventStatus();
    if(eventStatus)
      eventStatus.resetFocus = false;
    this.setBBSCmd("doCopyAnsi");
  },

  pasteText: function() {
    this.setBBSCmd("doPaste");
  },

  delayPasteText: function() {
    this.setBBSCmd("doDelayPasteText");
  },

  selectAllText: function() {
    //this.setHandlerParem('resetFocus', '0');
    var eventStatus = this.getEventStatus();
    if(eventStatus)
      eventStatus.resetFocus = false;
    this.setBBSCmdEx({command:"doSelectAll", resetFocus:false});
  },

  embeddedPlayer: function() {
    var eventStatus = this.getEventStatus();
    if(!eventStatus)
      return;
    this.setBBSCmdEx({command:"openPlayerWindow", videoUrl:eventStatus.videoUrl, videoType:eventStatus.videoType});
  },

  previewPicture: function() {
    var eventStatus = this.getEventStatus();
    if(!eventStatus)
      return;
    this.setBBSCmdEx({command:"previewPicture", pictureUrl:eventStatus.pictureUrl});
  },

  openAllLink: function() {
    this.setBBSCmd("doOpenAllLink");
  },

  downloadPost: function(mode) {
    //this.setHandlerParem('DownloadColor', mode);
    this.setBBSCmdEx({command:"doDownloadPost", downloadColor:mode});
  },

  loadFile: function() {
    this.setBBSCmd("doLoadFile");
  },

  screenKeyboard: function() {
    this.setBBSCmd("openSymbolInput");
  },

  savePage: function() {
    this.setBBSCmd("doSavePage");
  },

  cmdSavePage: function(event) {
    if(this.isOnBBSPage()) {
      this.savePage();
      event.stopPropagation();
      event.preventDefault();
    }
  },

  cmdPaste: function(event) {
    /* if we handle this command, we get paste text twice. (even if we set preventDefault!)
    if(this.isOnBBSPage()) {
      this.pasteText();
      event.stopPropagation();
      event.preventDefault();
    }
    */
  },

  cmdCopy: function(event) {
    if(this.isOnBBSPage()) {
      var eventStatus = this.getEventStatus();
      if(eventStatus)
        eventStatus.resetFocus = false;

      this.copyText();
      event.stopPropagation();
      event.preventDefault();
    }
  },

  cmdSelectAll: function(event) {
    if(this.isOnBBSPage()) {
      var eventStatus = this.getEventStatus();
      if(eventStatus)
        eventStatus.resetFocus = false;

      this.selectAllText();
      event.stopPropagation();
      event.preventDefault();
    }
  },

  copyHtml: function() {
    this.setBBSCmd("doCopyHtml");
  },

  switchMouseBrowse: function() {
    this.setBBSCmd("switchMouseBrowsing");
  },

  switchBgDisplay: function() {
    this.setBBSCmd("switchBgDisplay");
  },

  easyReading: function() {
    this.setBBSCmd("easyReading");
  },

  pushThread: function() {
    this.setBBSCmd("pushThread");
  },

  openThreadUrl: function() {
    this.setBBSCmd("openThreadUrl");
  },

  changeColorTable: function() {
    this.setBBSCmd("changeColorTable");
  },

  addToBlacklist: function() {
    //var eventStatus = this.getEventStatus();
    //if(eventStatus)
    //  eventStatus.resetFocus = false;
    this.setBBSCmd("addToBlacklist");
  },

  removeFromBlacklist: function() {
    //var eventStatus = this.getEventStatus();
    //if(eventStatus)
    //  eventStatus.resetFocus = false;
    this.setBBSCmd("removeFromBlacklist");
  },

  replyRobot: function() {
//    try{
//      if(window.EttReplyRobot)
//        window.EttReplyRobot.insertText();
//    }catch(ex){};
  },

  setAlert: function(str) {
    //this.setHandlerParem('AlertMessage', str);
    this.setBBSCmdEx({command:"setAlert", alertMessage:str});
  },

  EventHandler: {
    MouseRBtnDown: false,
    MouseLBtnDown: false,
    owner: null,
    //oldEnlarge: null,
    //oldReduce: null,
    os: Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS,

    /*
    //TODO: call frame-script to do this.
    loadpptPic: function(doc) {
    },

    insertPicLine: function(anode, imageurl) {
    },
    */

    mouse_down: function(event) {
      if(event.button==2)
        this.MouseRBtnDown = true;
      else if(event.button==0)
        this.MouseLBtnDown = true;
    },

    mouse_up: function(event) {
      if(event.button==2)
        this.MouseRBtnDown = false;
      else if(event.button==0)
        this.MouseLBtnDown = false;

      if (gBrowser && gBrowser.currentURI) {
        var scheme = gBrowser.currentURI.scheme;
        if(scheme!='telnet' && scheme!='ssh')
          return;

        var prefs = this.owner.getEventPrefs();
        if(!prefs || !prefs.result)
          return;

        var eventStatus = this.owner.getEventStatus();
        var mouseWheelFunc2 = (prefs.mouseWheelFunc2!=0);
        if(mouseWheelFunc2) {
          if(event.button==2) {
            if(this.os == 'WINNT') {
              //do nothing...
            } else {//if Linux or Mac, show popup menu.
              if(!eventStatus.doDOMMouseScroll) {
                /*
                //need dispatchEvent in frame-script, but we lost our e.originalTarget!
                var e = event;
                var evt = e.originalTarget.ownerDocument.createEvent("MouseEvents");//fire event !
                evt.initMouseEvent("contextmenu", true, true, e.originalTarget.ownerDocument.defaultView, 0,
                                    e.screenX, e.screenY, e.clientX, e.clientY,
                                    false, false, false, false, 2, null);
                e.originalTarget.dispatchEvent(evt);
                */
                this.owner.setBBSCmdEx({command:"contextmenu",
                                        screenX:event.screenX,
                                        screenY:event.screenY,
                                        clientX:event.clientX,
                                        clientY:event.clientY});

              }
            }
          }
        }
      }
    },

    mouse_menu: function(event) {
      if (gBrowser && gBrowser.currentURI) {
        var scheme = gBrowser.currentURI.scheme;
        if(scheme!='telnet' && scheme!='ssh')
          return;

        var prefs = this.owner.getEventPrefs();
        if(!prefs || !prefs.result)
          return;

        var linkedBrowser;
        var eventStatus = this.owner.getEventStatus();
        var mouseWheelFunc2 = (prefs.mouseWheelFunc2!=0);
        if(mouseWheelFunc2) {

          if(eventStatus.doDOMMouseScroll) {
            event.stopPropagation();
            event.preventDefault();
            eventStatus.doDOMMouseScroll = false;
          } else {
            if(this.os == 'WINNT') {
              //do nothing...
            } else if(this.MouseRBtnDown) {//if Linux or Mac, delay popup menu.
              event.stopPropagation();
              event.preventDefault();
              return;
            }
            //Can't modify 'context' anymore?
            /*
            linkedBrowser = gBrowser.mCurrentTab.linkedBrowser;
            if(linkedBrowser) {
              if(prefs.useHttpContextMenu)
                linkedBrowser.setAttribute('context', 'contentAreaContextMenu');
              else
                linkedBrowser.setAttribute('context', 'contentAreaContextMenuEx');
            } else {
              //console.log('linkedBrowser null');
            }
            */
          }

        } else {
          /*
          //Can't modify 'context' anymore?
          linkedBrowser = gBrowser.mCurrentTab.linkedBrowser;
          if(linkedBrowser) {
            if(prefs.useHttpContextMenu)
              linkedBrowser.setAttribute('context', 'contentAreaContextMenu');
            else
              linkedBrowser.setAttribute('context', 'contentAreaContextMenuEx');
          }
          */
        }
      }
    },

    mouse_scroll: function(event) {
      if (gBrowser && gBrowser.currentURI){
        var scheme = gBrowser.currentURI.scheme;
        if(scheme!='telnet' && scheme!='ssh')
          return;

        var prefs = this.owner.getEventPrefs();
        if(!prefs || !prefs.result)
          return;

        var mouseWheelFunc1 = prefs.mouseWheelFunc1;
        var mouseWheelFunc2 = prefs.mouseWheelFunc2;
        var mouseWheelFunc3 = prefs.mouseWheelFunc3;

        var useMouseWheelFunc1 = (mouseWheelFunc1!=0);
        var useMouseWheelFunc2 = (mouseWheelFunc2!=0);
        var useMouseWheelFunc3 = (mouseWheelFunc3!=0);
        if(useMouseWheelFunc1 || useMouseWheelFunc2 || useMouseWheelFunc3) {
          var eventStatus = this.owner.getEventStatus();
          var owner = this.owner;
          //var curApp = this.view.cursorAppMode;
          if(event.detail < 0) { //scroll up
            if(this.MouseRBtnDown) { //press mouse right button and scroll up
              if(useMouseWheelFunc2) {
                if(mouseWheelFunc2==1)
                  owner.setBBSCmd("doArrowUp");
                else if(mouseWheelFunc2==2)
                  owner.setBBSCmd("doPageUp");
                else if(mouseWheelFunc2==3)
                  owner.setBBSCmd("prevousThread");
                else if(mouseWheelFunc2==4)
                  owner.setBBSCmd("doHome");
                event.stopPropagation();
                event.preventDefault();
              }
            } else if(this.MouseLBtnDown) { //press mouse left button and scroll up
              if(useMouseWheelFunc3) {
                if(mouseWheelFunc3==1)
                  owner.setBBSCmd("doArrowUp");
                else if(mouseWheelFunc3==2)
                  owner.setBBSCmd("doPageUp");
                else if(mouseWheelFunc3==3)
                  owner.setBBSCmd("prevousThread");
                else if(mouseWheelFunc3==4)
                  owner.setBBSCmd("doHome");
                owner.setBBSCmd("cancelHoldMouse");
                event.stopPropagation();
                event.preventDefault();
              }
            } else if(useMouseWheelFunc1) { //no button, only scroll up
              if(mouseWheelFunc1==1)
                owner.setBBSCmd("doArrowUp");
              else if(mouseWheelFunc1==2)
                owner.setBBSCmd("doPageUp");
              else if(mouseWheelFunc1==3)
                owner.setBBSCmd("prevousThread");
              else if(mouseWheelFunc1==4)
                owner.setBBSCmd("doHome");
              event.stopPropagation();
              event.preventDefault();
            }
          } else { //scroll down
            if(this.MouseRBtnDown) { //press mouse right button and scroll down
              if(useMouseWheelFunc2) {
                if(mouseWheelFunc2==1)
                  owner.setBBSCmd("doArrowDown");
                else if(mouseWheelFunc2==2)
                  owner.setBBSCmd("doPageDown");
                else if(mouseWheelFunc2==3)
                  owner.setBBSCmd("nextThread");
                else if(mouseWheelFunc2==4)
                  owner.setBBSCmd("doEnd");
                event.stopPropagation();
                event.preventDefault();
              }
            } else if(this.MouseLBtnDown) { //press mouse left button and scroll down
              if(useMouseWheelFunc3) {
                if(mouseWheelFunc3==1)
                  owner.setBBSCmd("doArrowDown");
                else if(mouseWheelFunc3==2)
                  owner.setBBSCmd("doPageDown");
                else if(mouseWheelFunc3==3)
                  owner.setBBSCmd("nextThread");
                else if(mouseWheelFunc3==4)
                  owner.setBBSCmd("doEnd");
                owner.setBBSCmd("cancelHoldMouse");
                event.stopPropagation();
                event.preventDefault();
              }
            } else if(useMouseWheelFunc1) { //no button, only scroll down
              if(mouseWheelFunc1==1)
                owner.setBBSCmd("doArrowDown");
              else if(mouseWheelFunc1==2)
                owner.setBBSCmd("doPageDown");
              else if(mouseWheelFunc1==3)
                owner.setBBSCmd("nextThread");
              else if(mouseWheelFunc1==4)
                owner.setBBSCmd("doEnd");
              event.stopPropagation();
              event.preventDefault();
            }
          }

          if(this.MouseRBtnDown && useMouseWheelFunc2) //prevent context menu popup
            eventStatus.doDOMMouseScroll = true;
          if(this.MouseLBtnDown && useMouseWheelFunc3) {
            //TODO: fix this, tell content page skip this mouse click.
            //if(cmdhandler.getAttribute('useMouseBrowsing')=='1') {
            //  cmdhandler.setAttribute('SkipMouseClick','1');
            //}
          }

        }
      }
    },

    key_press: function(event) {
        var owner = this.owner;
        var prefs = owner.getEventPrefs();
        if(!prefs || !prefs.result)
          return;

        if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
          switch(event.keyCode) {
            case 33: //Page Up
              event.stopPropagation();
              event.preventDefault();
              owner.setBBSCmd("doPageUp");
              return;
            case 34: //Page Down
              event.stopPropagation();
              event.preventDefault();
              owner.setBBSCmd("doPageDown");
              return;
            case 38: //Arrow Up
              event.stopPropagation();
              event.preventDefault();
              owner.setBBSCmd("doArrowUp");
              return;
            case 40: //Arrow Down
              event.stopPropagation();
              event.preventDefault();
              owner.setBBSCmd("doArrowDown");
              return;
            default:
              break;
          }
        }
        if(event.charCode){
          if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 118 || event.charCode == 86) && prefs.hokeyForPaste) { //Shift + ^V, do paste
            owner.pasteText();
            event.preventDefault();
            event.stopPropagation();
          }
          else if (event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode==109 || event.charCode==77) && prefs.hokeyForMouseBrowsing) {
            owner.switchMouseBrowse();
            event.stopPropagation();
            event.preventDefault();
          }
        }
    },

    /*
    TODO: handle read easy-reading Html file, try load ppt and imgur image.
    doc_load: function(event) {
    },
    */

    init: function(owner) {
      this.owner = owner;

      //this.pptPicLoader = new BBSPPTPicLoader(null);
      //this.imgurPicLoader = new BBSImgurPicLoader(null);

      var eventMap = this.owner.eventMap;
      eventMap.set('DOMMouseScroll', this.mouse_scroll.bind(this));
      eventMap.set('contextmenu', this.mouse_menu.bind(this));
      eventMap.set('mousedown', this.mouse_down.bind(this));
      eventMap.set('mouseup', this.mouse_up.bind(this));
      eventMap.set('keypress', this.key_press.bind(this));
      //eventMap.set('input', this.text_input.bind(this));
      //eventMap.set('load', this.doc_load.bind(this));

      gBrowser.addEventListener('DOMMouseScroll', eventMap.get('DOMMouseScroll'), true);
      gBrowser.addEventListener("contextmenu", eventMap.get('contextmenu'), true);
      //document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', eventMap.get('contextmenu'), true);
      gBrowser.addEventListener("mousedown", eventMap.get('mousedown'), true);
      gBrowser.addEventListener('mouseup', eventMap.get('mouseup'), true);
      gBrowser.addEventListener("keypress", eventMap.get('keypress'), true);
      //gBrowser.addEventListener("input", eventMap.get('input'), true);
      //gBrowser.addEventListener("load", eventMap.get('load'), true);
    },

    release: function() {
      var eventMap = this.owner.eventMap;

      gBrowser.removeEventListener("DOMMouseScroll", eventMap.get('DOMMouseScroll'), true);
      gBrowser.removeEventListener("contextmenu", eventMap.get('contextmenu'), true);
      //document.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', eventMap.get('contextmenu'), true);
      gBrowser.removeEventListener("mousedown", eventMap.get('mousedown'), true);
      gBrowser.removeEventListener('mouseup', eventMap.get('mouseup'), true);
      gBrowser.removeEventListener('keypress', eventMap.get('keypress'), true);
      //gBrowser.removeEventListener('input', eventMap.get('input'), true);
      //gBrowser.removeEventListener('load', eventMap.get('load'), true);
    }
  }
};

//////////////////////////////////////////////////////////////////////////
window.addEventListener("load",   ETT_BBSFOX_Overlay.init.bind(ETT_BBSFOX_Overlay), false);
window.addEventListener("unload", ETT_BBSFOX_Overlay.release.bind(ETT_BBSFOX_Overlay), false);

window.messageManager.loadFrameScript("chrome://bbsfox/content/bbsfox_frame_script.js", true);
window.messageManager.addMessageListener("bbsfox@ettoolong:bbsfox-coreCommand",  ETT_BBSFOX_Overlay.coreCommand.bind(ETT_BBSFOX_Overlay) );