// Main Program

function BBSFox() {
    this.os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
    var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    this.FXVersion = parseFloat(appInfo.version);

    Components.utils.import("resource://bbsfox/uao.js");

    this.CmdHandler = document.getElementById('cmdHandler');
    this.CmdHandler.setAttribute('bbsfox', true);
    this.CmdHandler.setAttribute('UpdateIcon', 'chrome://bbsfox/skin/logo/logo.png');
    this.CmdHandler.setAttribute('useTextDragAndDrop', '0'); // ?
    this.CmdHandler.setAttribute('DragingWindow', '0');
    this.CmdHandler.setAttribute('MaxZIndex', 11);
    this.CmdHandler.setAttribute('LastPicAddr', '0');
    this.CmdHandler.setAttribute('SkipMouseClick','0');

    this.prefs = new bbsfoxPrefHandler(this);
    this.conn = new ConnectCore(this);
    this.view = new TermView(80, 24);
    this.buf = new TermBuf(80, 24);
    this.playerMgr = new EmbeddedPlayerMgr(this);
    //this.pptPicLoader = new BBSPPTPicLoader(this);
    //this.imgurPicLoader = new BBSImgurPicLoader(this);
    this.extPicLoader = new ExtPicLoader(this);
    this.extPicLoader.setCallback("load", this.showPicPreview.bind(this) );
    this.extPicLoader.setCallback("locate", this.setPicLocation.bind(this) );
    this.picViewerMgr = new PicViewerMgr(this, this.extPicLoader);
    this.bbsbg = new BBSBackground(this);
    this.symbolinput = new SymbolInput(this);
    this.ansiColorTool = new AnsiColorTool(this);
    this.overlaycmd = new BBSOverlayCmdListener(this);
    this.buf.setView(this.view, this.prefs);
    this.buf.severNotifyStr=this.getLM('messageNotify');
    this.buf.initPttStr();
    this.view.setCore(this, this.buf, this.conn);
    this.parser = new AnsiParser(this.buf);
    this.ansiColor = new AnsiColor(this);
    this.robot=new Robot(this);
    this.keyEventStatus = true;

    this.prefListener=null;
    this.isDefaultPref=true;

    this.unusedTime = 0;
    this.connectTime = 0;
    this.connectState = 0;
    this.abnormalClose = false;

    this.DocInputArea = document.getElementById('t');
    this.BBSWin = document.getElementById('BBSWindow');
    this.btnCloseSymbolInput = document.getElementById('btnCloseSymbolInput'); //??

    this.asciitable = window.asciiTable;
    this.ctrlTable = window.ctrlTable;
    this.mouseLeftButtonDown = false;

    this.DelayPasteBuffer = '';
    this.DelayPasteIndex = -1;
    this.DelayPasteNotify = true;

    this.LastMouseDownX = 0;
    this.LastMouseDownY = 0;
    //this.CanExecMouseDown = true;
    this.DragText = false;

    this.settingCheckTimer = null;
    this.inputAreaFocusTimer = null;

    this.tempFiles=[];
    this.alertBeforeUnload = false;
    this.pushTextTemp = '';

    window.addEventListener('click', this.mouse_click.bind(this), false);
    window.addEventListener('mousedown', this.mouse_down_init.bind(this), true);
    window.addEventListener('mousedown', this.mouse_down.bind(this), false);
    window.addEventListener('mouseup', this.mouse_up.bind(this), false);
    document.addEventListener('mousemove', this.mouse_move.bind(this), false);
    document.addEventListener('mouseover', this.mouse_over.bind(this), false);
    document.addEventListener ('dragstart', this.mouse_dragstart.bind(this), false);
    document.addEventListener ('dragover', this.mouse_dragover.bind(this), false);
    document.addEventListener ('drop', this.mouse_dragdrop.bind(this), false);
    document.addEventListener ('dragend', this.mouse_dragend.bind(this), false);
    document.addEventListener('keypress', this.key_press.bind(this), true);
    //window.addEventListener('keypress', this.key_press.bind(this), true);

    this.view.fontResize();
    this.dblclickTimer = null;
    this.mouseDownTimer = null;
    this.mbTimer = null;
    this.timerOnsec = null;

    //window.controllers.insertControllerAt(0, this.documentControllers);            // to override default commands for window, can't working in E10S
    this.DocInputArea.controllers.insertControllerAt(0, this.documentControllers); // to override default commands for inputbox, can't working in E10S
}

BBSFox.prototype={
    _bundle: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService)
            .createBundle("chrome://bbsfox/locale/bbsfox.properties"),

    youtubeRegEx: /((https?:\/\/www\.youtube\.com\/watch\?.*(v=[A-Za-z0-9._%-]*))|(https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*))|(https?:\/\/m\.youtube\.com\/watch\?.*(v=[A-Za-z0-9._%-]*)))/i,
    ustreamRegEx: /(http:\/\/www\.ustream\.tv\/(channel|channel-popup)\/([A-Za-z0-9._%-]*))/i,
    urecordRegEx: /(http:\/\/www\.ustream\.tv\/recorded\/([0-9]{5,10}))/i,
    PttRegEx: /^((bbs\.)?(ptt(2|3)?\.cc)|(ptt(2|3)?\.twbbs\.org))$/i,
    //there are some problem: http://www.ustream.tv/xxx -> http://www.ustream.tv/channel/xxx

    documentControllers: {
      supportsCommand: function(cmd){
        switch (cmd) {
          case "cmd_undo":
          case "cmd_redo":
          case "cmd_cut":
          case "cmd_copy":
          case "cmd_paste":
          case "cmd_selectAll":
          case "cmd_delete":
          case "cmd_switchTextDirection":
          case "cmd_find":
          case "cmd_findAgain":
            return true;
        }
      },
      isCommandEnabled: function(cmd){
        switch (cmd) {
          case "cmd_copy":
            if(window.getSelection().isCollapsed) //not select anything
              return false;
          case "cmd_paste":
          case "cmd_selectAll":
            return true;
          default:
            return false;
        }
      },
      doCommand: function(cmd){
        switch (cmd) {
          case "cmd_undo":
          case "cmd_redo":
          case "cmd_cut":
            return true;
          case "cmd_copy":
            bbsfox.doCopySelect();
            break;
          case "cmd_paste":
            bbsfox.doPaste();
            break;
          case "cmd_selectAll":
            bbsfox.doSelectAll();
            break;
          case "cmd_delete":
          case "cmd_switchTextDirection":
          case "cmd_find":
          case "cmd_findAgain":
            return true;
        }
      },
      onEvent: function(e){ }
    },

    connect: function(extData, hostkeys) {
        this.conn.connect(document.location.hostname, document.location.port ? document.location.port : BBSFOX_DEFAULT_PORT, extData, hostkeys);
    },

    symbtnclick: function(e){
      if(this.connectState==1)
      {
        this.conn.convSend(e.target.label, this.prefs.charset);
        this.setInputAreaFocus();
      }
    },

    //getLocalizedMessage
    getLM: function(msg) {
        return this._bundle.GetStringFromName(msg);
    },

    getLMBundle: function() {
        return this._bundle;
    },

    isPTT: function(address) {
      if(address)
        return this.PttRegEx.test(address);
      else {
        if(this.connToPTT == undefined)
          this.connToPTT = this.PttRegEx.test(document.location.hostname);
        return this.connToPTT;
         //return (address=='ptt.cc' || address=='bbs.ptt.cc' || address=='ptt.twbbs.org');
      }
    },

    close: function() {
        this.CmdHandler.removeAttribute('bbsfox');
        //window.controllers.removeController(this.documentControllers);            // to override default commands for window
        //this.DocInputArea.controllers.removeController(this.documentControllers); // to override default commands for inputbox
        if(this.timerOnsec)
        {
          this.timerOnsec.cancel();
          this.timerOnsec = null;
        }

        if(this.reconnectTimer) {
          this.reconnectTimer.cancel();
          this.reconnectTimer = null;
        }

        if(this.conn.inputStream) {
            this.abnormalClose = true;
            this.conn.close();
        }

        this.buf.timerUpdate.cancel();
        this.view.blinkTimeout.cancel();
        this.view.blinkTimeout = null;
        if(this.settingCheckTimer)
        {
          this.settingCheckTimer.cancel();
          this.settingCheckTimer = null;
        }
        this.cancelMouseDownTimer();
        this.cancelMbTimer();
        this.cancelDownloadAndPaste();
    },

    onConnect: function(conn) {
        this.connectState = 1;
        this.updateTabIcon('connect');
        this.unusedTime = 0;
        this.timerOnsec = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        this.timerOnsec.initWithCallback(this, 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
    },

    onData: function(conn, data) {
        this.parser.feed(data);
    },

    onClose: function(conn) {
        this.UnregExitAlert();

        this.connectState = 2;
        this.unusedTime = 0;
        //alert(this.stringBundle.getString("alert_conn_close"));
        this.updateTabIcon('disconnect');

        if(this.timerOnsec)
        {
          this.timerOnsec.cancel();
          this.timerOnsec = null;
        }
    },

    onReconnect: function() {
      if(this.reconnectTimer) {
        this.reconnectTimer.cancel();
        this.reconnectTimer = null;
      }
      if(!this.prefs.reconnectDelay) {
        //issue: if (!this.reconnectDelay) && (this.reconnectCount==0), will try reconnect VERY quickly. when your network is not ready, that will make some problem!
        if(this.prefs.reconnectCount == 0) //always reconnect
        {
          var _this = this;
          this.reconnectTimer = setTimer(false, function() {
            _this.buf.clear(2);
            _this.buf.attr.resetAttr();
            _this.reconnectTimer = null;
            _this.conn.connect();
          }, 500);
        }
        else
        {
          this.buf.clear(2);
          this.buf.attr.resetAttr();
          this.conn.connect();
        }
      } else {
        var _this = this;
        this.reconnectTimer = setTimer(false, function() {
          _this.buf.clear(2);
          _this.buf.attr.resetAttr();
          _this.reconnectTimer = null;
          _this.conn.connect();
        }, this.prefs.reconnectDelay * 1000);
      }
    },

    trim_left: function(str) {
      return str.replace(/^\s+/,'');
    },

    trim_right: function(str) {
      return str.replace(/\s+$/,'');
    },

    trim_both: function(str) {
      return str.replace(/^\s+|\s+$/g,'');
    },

    resetUnusedTime: function() {
      this.unusedTime = 0;
    },

    sendData: function(str) {
      if(this.connectState==1)
        this.conn.convSend(str, this.prefs.charset);
    },

    sendCmdData: function(str) {
      if(this.connectState==1)
        this.conn.send(str);
    },

    cancelMbTimer: function() {
      if(this.mbTimer)
      {
        this.mbTimer.cancel();
        this.mbTimer=null;
      }
    },

    setMbTimer: function() {
      this.cancelMbTimer();
      var _this=this;
      var func=function() {
        _this.mbTimer=null;
        _this.CmdHandler.setAttribute('SkipMouseClick','0');
      };
      this.mbTimer = setTimer(false, func, 100);
    },

    cancelDblclickTimer: function(enableEvent) {
      if(enableEvent && this.dblclickTimer) {
        this.view.BBSWin.style.MozUserSelect = 'text';
      }
      if(this.dblclickTimer)
      {
        this.dblclickTimer.cancel();
        this.dblclickTimer=null;
      }
    },

    setDblclickTimer: function() {
      this.cancelDblclickTimer();
      this.view.BBSWin.style.MozUserSelect = 'none';
      var _this=this;
      var func=function() {
        _this.dblclickTimer=null;
        _this.view.BBSWin.style.MozUserSelect = 'text';
      };
      this.dblclickTimer = setTimer(false, func, 400);
    },

    cancelMouseDownTimer: function() {
      if(this.mouseDownTimer)
      {
        this.mouseDownTimer.cancel();
        this.mouseDownTimer=null;
      }
    },

    focusTab: function(event) {
      this.setInputAreaFocus();
    },

    setInputAreaFocus: function() {
      //this.DocInputArea.disabled="";
      this.DocInputArea.focus();
    },

    setDelayInputAreaFocus: function() {
      if(this.dblclickTimer)
      {
        this.dblclickTimer.cancel();
        this.dblclickTimer=null;
      }
      var _this=this;
      var func=function() {
        _this.inputAreaFocusTimer.cancel();
        _this.inputAreaFocusTimer=null;
        _this.setInputAreaFocus();
      };
      this.inputAreaFocusTimer = setTimer(false, func, 1);
    },

    redraw: function() {
        var rows=this.buf.rows;
        var lines=this.buf.lines;
        for(var row=0; row<rows; ++row) {
            var line=lines[row];
            line[0].needUpdate = true;
        }
        this.buf.updateCharAttr();
        this.view.update(true);
        this.setInputAreaFocus();
    },

    doCopy: function(str) {
      var clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
      if(this.prefs.deleteSpaceWhenCopy)
      {
        var strArray;
        if(this.os == 'WINNT')
          strArray = str.split('\r\n');
        else
          strArray = str.split('\n');

        str = '';
        for (var i=0 ;i<strArray.length ;i++)
        {
          str+=this.trim_right(strArray[i]);
          if(i<strArray.length-1){
            if(this.os == 'WINNT')
              str+='\r\n';
            else
              str+='\n';
          }
        }
      }
      clipboardHelper.copyString(str);

      var evt = document.createEvent("HTMLEvents");
      evt.initEvent('copy', true, true);
      this.view.input.dispatchEvent(evt);
    },

    doCopySelect: function() {
      var selstr = window.getSelection().toString();
      this.doCopy(selstr);
      if(this.prefs.clearCopiedSel)
      {
        var sel = window.getSelection();
        if(sel.rangeCount > 0) sel.removeAllRanges();
        this.setInputAreaFocus();
      }
    },

    doAnsiCopySelect: function() {
      if (window.getSelection().isCollapsed)
        return;
      var selection = this.view.getSelectionColRow();
      //alert("selection.start.row = " + selection.start.row +", selection.start.col =" + selection.start.col + ", selection.end.row = " + selection.end.row +", selection.end.col =" + selection.end.col);

      var ansiText = '';
      if (selection.start.row == selection.end.row) {
        ansiText += this.buf.getText(selection.start.row, selection.start.col, selection.end.col+1, true, true, false);
      } else {
        for (var i = selection.start.row; i <= selection.end.row; ++i) {
          var scol = 0;
          var ecol = this.buf.cols-1;
          if (i == selection.start.row) {
            scol = selection.start.col;
          } else if (i == selection.end.row) {
            ecol = selection.end.col;
          }
          ansiText += this.buf.getText(i, scol, ecol+1, true, true, false);
          if (i != selection.end.row ) {
            if(this.os == 'WINNT')
              ansiText += '\r\n';
            else
              ansiText += '\n';
          }
        }
      }
      this.doCopy(ansiText);
      if(this.prefs.clearCopiedSel)
      {
        var sel = window.getSelection();
        if(sel.rangeCount > 0) sel.removeAllRanges();
        this.setInputAreaFocus();
      }

    },

    doDelayPasteText: function() {
      var clip = Components.classes["@mozilla.org/widget/clipboard;1"]
                            .getService(Components.interfaces.nsIClipboard);
      if(clip)
      {
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        if (trans){
          var loadContext = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIWebNavigation)
                  .QueryInterface(Components.interfaces.nsILoadContext);
          trans.init(loadContext);
          trans.addDataFlavor("text/unicode");
          clip.getData(trans, clip.kGlobalClipboard);
          var data={};
          var len={};
          trans.getTransferData("text/unicode", data, len);
          if(data && data.value) {
            var s = data.value.QueryInterface(Components.interfaces.nsISupportsString);
            s = s.data.substring(0, len.value / 2);
            s = s.replace(/\r\n/g, '\r');
            s = s.replace(/\n/g, '\r');
            s = s.replace(/\r/g, this.prefs.EnterChar);
            if(this.prefs.lineWrap && s.indexOf('\x1b') == -1)
              s = wrapText(s, this.prefs.lineWrap, this.prefs.EnterChar);
            s = s.replace(/\x1b/g, this.prefs.EscChar);
            //this.sendData(s);
            this.DelayPasteBuffer = s;
            this.DelayPasteIndex = 0;
          }
        }
      }
    },

    doPasteStr: function(s) {
      if(this.conn) {
        s = s.replace(/\r\n/g, '\r');
        s = s.replace(/\n/g, '\r');
        s = s.replace(/\r/g, this.prefs.EnterChar);
        if(this.prefs.lineWrap && s.indexOf('\x1b') == -1)
          s = wrapText(s, this.prefs.lineWrap, this.prefs.EnterChar);
        s = s.replace(/\x1b/g, this.prefs.EscChar);
        this.conn.convSend(s, this.prefs.charset);
      }
    },

    doPaste: function(extbuf) {
        if(this.conn) {
            // From: https://developer.mozilla.org/en/Using_the_Clipboard
            var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            if(!clip)
                return false;
            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            if (!trans) return false;
            var loadContext = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIWebNavigation)
                  .QueryInterface(Components.interfaces.nsILoadContext);
            trans.init(loadContext);
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);
            var data={};
            var len={};
            try
            {
              trans.getTransferData("text/unicode", data, len);
            }
            catch(error)
            {
              return;
            }
            if(data && data.value) {
                var s=data.value.QueryInterface(Components.interfaces.nsISupportsString);
                s = s.data.substring(0, len.value / 2);
                s = s.replace(/\r\n/g, '\r');
                s = s.replace(/\n/g, '\r');
                if(extbuf) return s.replace(/\r/g, '\r\n');
                s = s.replace(/\r/g, this.prefs.EnterChar);
                if(this.prefs.lineWrap && s.indexOf('\x1b') == -1)
                  s = wrapText(s, this.prefs.lineWrap, this.prefs.EnterChar);
                s = s.replace(/\x1b/g, this.prefs.EscChar);
                this.conn.convSend(s, this.prefs.charset);
            }
        }
    },

    getSelectStr: function() {
      var selstr = window.getSelection().toString();
      return selstr;
    },

    doSelectAll: function() {
      //var allspans = document.getElementById("main");
      window.getSelection().selectAllChildren(this.view.mainDisplay);
    },

    doCopyHtml: function() {
      var clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                       .getService(Components.interfaces.nsIClipboardHelper);
      clipboardHelper.copyString(this.getPageSourceCode());
    },

    doSavePage: function() {
      this.saveDialog(this.getPageSourceCode());
    },

    saveDialog: function(data) {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      this.sendCoreCommand({command: "openFilepicker",
                            title: null,
                            mode: nsIFilePicker.modeSave,
                            defaultExtension:"html",
                            defaultString: "newhtml",
                            appendFilters: [nsIFilePicker.filterHTML],
                            saveData: data,
                            convertUTF8: true});
    },

    getCssData: function(filename) {
      var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
      var channel = ioService.newChannel('chrome://bbsfox/skin/'+filename+'.css', null, null);
      var ins = channel.open();
      var scriptableStream=Components.classes["@mozilla.org/scriptableinputstream;1"].getService(Components.interfaces.nsIScriptableInputStream);
      scriptableStream.init(ins);
      var str=scriptableStream.read(ins.available());
      scriptableStream.close();
      ins.close();
      return str;
    },

    replaceColorDefines: function(cssCode){
      var getColorValue = function(hexTripletColor) {
          return hexTripletColor;
      };
      var getInvertColorValue = function(hexTripletColor) {
          return hexTripletColor;
      };
      if(this.view.colorTable == 0)
        getInvertColorValue = this.view.invertColor;
      if(this.view.colorTable == 1)
        getColorValue = this.view.invertColor;

        var prefs = this.prefs;
        for(var i=0;i<16;++i){
          var colorRegex = new RegExp('var\\(--bbscolor-'+i+'\\)', 'g');
          var invColorRegex = new RegExp('var\\(--bbscolor-inv-'+i+'\\)', 'g');
          cssCode = cssCode.replace(colorRegex, getColorValue(prefs.bbsColor[i]));
          cssCode = cssCode.replace(invColorRegex, getInvertColorValue(prefs.bbsColor[i]));
        }
        return cssCode;
    },

    getMainCssDefine: function(){

      var css1 = this.getCssData('color');
      css1 = this.replaceColorDefines(css1);
      var css2 = '';
      if(this.prefs.fixUnicodeDisplay)
      {
        css1 = css1.replace('.BBSLine{display:inline', '.BBSLine{display:block');
        css2 = this.getCssData('color-fix');
        css2 = this.replaceColorDefines(css2);
      }
      css1 = css1.replace(/\r\n/g, '');
      css2 = css2.replace(/\r\n/g, '');
      return css1 + css2;
    },

    getPageSourceCode: function(){
      var selstr='';

      this.view.doBlink = false;
      this.view.blinkOn = true;
      this.buf.notify();
      this.view.bbsCursor.style.display = 'none';
//      var allLinks = document.getElementsByTagName('a');
//      for (var i = 0; i < allLinks.length; i++)
//        allLinks[i].removeAttribute('onclick');

      var fontFace = this.prefs.fontFace;
      var bgcolor = (this.view.colorTable==0) ? this.prefs.bbsColor[0] : this.view.invertColor(this.prefs.bbsColor[0]);
      if(fontFace=="")
        fontFace = "MingLiu";
      selstr = '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style type="text/css">';
      selstr += '.main {font-family: ';
      selstr += fontFace;
      selstr += ';font-size: ';
      selstr += this.view.chh;
      selstr += 'px;background-color:' + bgcolor + ';line-height: 100%; margin: 0px;textAlign:';
      selstr += this.view.mainDisplay.style.textAlign;
      selstr += ';width:';
      selstr += this.view.mainDisplay.style.width;
      selstr += ';}body{color:white;background-color:' + bgcolor + ';margin:0px;}a,a:link,a:visited,a:active,a:hover{border-bottom: 0px;text-decoration:none;}#BBSWindow{position:relative;width:';
      selstr += document.documentElement.clientWidth;
      selstr += 'px;height:';
      selstr += document.documentElement.clientHeight;
      selstr += 'px;overflow:hidden;}';
      selstr += this.getMainCssDefine();

      selstr += '</style></head><body><div id="BBSWindow"><div id="main" class="main">';
      selstr += this.view.mainDisplay.innerHTML;
      selstr +='</div></div></body></html>';
      this.view.doBlink = true;
      this.view.bbsCursor.style.display = 'block';
//      for (var i = 0; i < allLinks.length; i++)
//      {
//        if(this.prefs.loadURLInBG) //this is only for developer testing
//          allLinks[i].setAttribute('onclick', "bbsfox.bgtab(event, this);" );
//      }

      return selstr;
    },

    getIndexOf: function(arr, str) {
      str = str.toLowerCase();
      for(var i=0;i<arr.length;++i) {
        if(arr[i].toLowerCase() == str)
          return i;
      }
      return -1;
    },

    doClearTrack: function() {
      this.prefs.highlightWords_local = [];
      this.redraw();
      this.prefs.updateOverlayPrefs([{key:'highlightWords', value:''}]);
    },

    doAddTrack: function() {
      var selstr = window.getSelection().toString().replace('\r\n','\n');
      var strArray = selstr.split('\n');

      selstr = this.trim_both(strArray[0]);
      var highlightWords_local = this.prefs.highlightWords_local;
      if(selstr != '') {
        highlightWords_local.push(selstr);
        this.redraw();
        this.prefs.updateOverlayPrefs([{key:'highlightWords', value:this.prefs.highlightWords_local.join('\n')}]);
      }
    },

    doDelTrack: function() {
      var selstr = window.getSelection().toString().replace('\r\n','\n');
      var strArray = selstr.split('\n');

      selstr = this.trim_both(strArray[0]);
      var highlightWords_local = this.prefs.highlightWords_local;

      if(selstr != '') {
        var idx;
        if(this.prefs.keyWordTrackCaseSensitive) {
          idx = highlightWords_local.indexOf(selstr);
          while( idx != -1) {
            highlightWords_local.splice(idx, 1);
            idx = highlightWords_local.indexOf(selstr);
          }
        } else {
          idx = this.getIndexOf(highlightWords_local, selstr);
          while( idx != -1) {
            highlightWords_local.splice(idx, 1);
            idx = this.getIndexOf(highlightWords_local, selstr);
          }
        }
        this.redraw();
        this.prefs.updateOverlayPrefs([{key:'highlightWords', value:this.prefs.highlightWords_local.join('\n')}]);
      }
    },

    doOpenAllLink: function() {
      var allLinks = document.getElementsByTagName('a');
      var urls = [];
      var charset = document.characterSet;
      for (var i = 0; i < allLinks.length; i++)
        urls.push(allLinks[i].getAttribute("href"));
      this.sendCoreCommand({command: "openNewTabs", charset: charset, ref: null, loadInBg: true, urls:urls});
    },

    switchMouseBrowsing: function() {
      if(this.prefs.useMouseBrowsing) {
        this.prefs.useMouseBrowsing=false;
      } else {
        this.prefs.useMouseBrowsing=true;
      }

      if(!this.prefs.useMouseBrowsing)
      {
        this.buf.BBSWin.style.cursor = 'auto';
        this.buf.clearHighlight();
        this.buf.mouseCursor=0;
        this.buf.nowHighlight=-1;
        this.buf.tempMouseCol=0;
        this.buf.tempMouseRow=0;
      }
      else
      {
        this.buf.SetPageState();
        this.buf.resetMousePos();
        this.view.update(true);
        this.view.updateCursorPos();
      }
      this.view.showAlertMessageEx(false, true, false, this.prefs.useMouseBrowsing?this.getLM('mouseBrowseOn'):this.getLM('mouseBrowseOff'));
      this.prefs.updateEventPrefs([{key:'useMouseBrowsing', value:this.prefs.useMouseBrowsing}]);
    },

    switchBgDisplay: function() {
      if(this.prefs.overlayPrefs.enableBackground)
        this.bbsbg.SwitchBgDisplay();
    },

    sendCodeStr: function(str, startIdx) {
      var arr = str.split(',');
      var table = this.asciitable;
      //var lastcodetype = '';
      for(var i=startIdx;i<arr.length;i++)
      {
        if(arr[i]!='')
        {
          if(arr[i].charCodeAt(0)==99) //char
            this.conn.convSend(arr[i].substr(1,arr[i].length), this.prefs.charset);
          else if(arr[i].charCodeAt(0)==120) //hexcode
          {
            //if(code=table[arr[i].toLowerCase()])
            this.conn.send(arr[i].substr(1,arr[i].length));
          }
          else if(arr[i].charCodeAt(0)==104) //hexcode
          {
            if(code=table[arr[i].toLowerCase()])
              this.conn.send(code);
          }
        }
      }
    },

    notify: function(timer) {
      //if(timer == this.timerOnsec)
        this.antiIdle();
    },

    antiIdle: function() {
      if(this.prefs.antiIdleTime && this.unusedTime > this.prefs.antiIdleTime)
      {
        if(this.prefs.antiIdleStr!='' && this.connectState==1)
          this.conn.send(this.prefs.antiIdleStr);
      }
      else
      {
        if(this.connectState==1)
          this.unusedTime+=1000;
      }

      if(this.DelayPasteBuffer != '' && this.DelayPasteIndex!=-1 && this.DelayPasteIndex < this.DelayPasteBuffer.length )
      {
        var s = this.DelayPasteBuffer.substr(this.DelayPasteIndex, 1);
        this.DelayPasteIndex++;
        this.sendData(s);
        if(this.DelayPasteIndex == this.DelayPasteBuffer.length)
        {
          this.DelayPasteBuffer = '';
          this.DelayPasteIndex = -1;
          if(this.DelayPasteNotify)
            this.view.showAlertMessageEx(false, true, false, this.getLM('delayPasteFinish'));
        }
      }
    },

    updateTabIcon: function(aStatus) {
      var icon = 'chrome://bbsfox/skin/logo/logo.png';
      switch (aStatus) {
        case 'connect':
          icon =  'chrome://bbsfox/skin/state_icon/connect.png';
          this.setInputAreaFocus();
          break;
        case 'disconnect':
          icon =  'chrome://bbsfox/skin/state_icon/disconnect.png';
          break;
        case 'newmessage':  // Not used yet
          icon =  'chrome://bbsfox/skin/state_icon/connect.png';
          break;
        case 'connecting':  // Not used yet
          icon =  'chrome://bbsfox/skin/state_icon/connecting.gif';
        default:
      }
      this.CmdHandler.setAttribute('UpdateIcon', icon);
      this.prefs.updateOverlayPrefs([{key:'tabIcon', value:icon}]);
      this.sendCoreCommand({command: "updateTabIcon", icon: icon});
    },

    setSelectStatus: function(selectStatus) {
      this.selectStatus = selectStatus;
    },

    setFrameScript: function(cb) {
      if(!this.FrameScriptCb) {
        //Update Overlay Prefs and Event Prefs
        this.FrameScriptCb = cb;
        if(this.prefs) {
          this.prefs.updateEventPrefs(); //force update
          this.prefs.updateOverlayPrefs(); //force update
          this.loadLoginData();
        } else {
        }
        return true;
      } else {
        this.FrameScriptCb = cb;
        this.prefs.updateEventPrefs(); //force update
        this.prefs.updateOverlayPrefs(); //force update
        this.sendCoreCommand({command: "updateTabIcon", icon: this.prefs.overlayPrefs.tabIcon});
        return false;
      }
    },

    sendCoreCommand: function(command, async) {
      if(this.FrameScriptCb)
        return this.FrameScriptCb(command, async);
    },

    /*
    clientToCursor: function(cX, cY){
      var x = cX - parseFloat(this.view.firstGrid.offsetLeft);
      var y = cY - parseFloat(this.view.firstGrid.offsetTop);
      var col = Math.floor(x / this.view.chw);
      var row = Math.floor(y / this.view.chh);
      if(row >=0 && row < this.buf.rows && col >=0 && col < this.buf.cols){
        return {col: col, row: row};
      }
      else  // client Y out of "rows" range (it's possible since we don't resize canvas height to fit chh*24)
        return false;
    },
    */

    clientToPos: function(cX, cY){
      var x,y;
      //alert(document.documentElement.clientWidth );
      if(this.prefs.horizontalAlignCenter && (this.view.scaleX!=1 || this.view.scaleY!=1))
        x = cX - ((document.documentElement.clientWidth - (this.view.chw*this.buf.cols)*this.view.scaleX)/2);
      else
        x = cX - parseFloat(this.view.firstGrid.offsetLeft);
      //var y = cY - parseFloat(this.view.firstGrid.offsetTop);
      if(this.prefs.verticalAlignCenter && (this.view.scaleX!=1 || this.view.scaleY!=1))
        y = cY - ((document.documentElement.clientHeight - (this.view.chh*this.buf.rows)*this.view.scaleY)/2);
      else
        y = cY - parseFloat(this.view.firstGrid.offsetTop);

      var col = Math.floor(x / (this.view.chw*this.view.scaleX));
      var row = Math.floor(y / (this.view.chh*this.view.scaleY));
      //var col = Math.floor(x / this.view.chw);
      //var row = Math.floor(y / this.view.chh);

      if(row < 0)
        row = 0;
      else if(row >= this.buf.rows-1)
        row = this.buf.rows-1;

      if(col < 0)
        col = 0;
      else if(col >= this.buf.cols-1)
        col = this.buf.cols-1;

      return {col: col, row: row};
    },

    isOnURL: function(testrow, testcol){
      //var cols=this.buf.cols;
      //var rows=this.buf.rows;
      var lines = this.buf.lines;
      //var chh = this.chh;

      //var lines = this.buf.lines;
      var line = lines[testrow];
      var ch = line[testcol];
      return ch.isPartOfURL();
    },

    onMouse_click: function(cX, cY){
      var sendstr = '';
      var count = 0;
      if(this.cancelDownloadAndPaste())
        return;
      /*
      switch( this.buf.PageState )
      {
        case 0: //NORMAL
          break;
        case 1://MENU
          break;
        case 2://LIST
      */
          switch (this.buf.mouseCursor) {
            case 1:
              this.conn.send('\x1b[D');  //Arrow Left
              break;
            case 2:
              this.conn.send('\x1b[5~'); //Page Up
              break;
            case 3:
              this.conn.send('\x1b[6~'); //Page Down
              break;
            case 4:
              this.conn.send('\x1b[1~'); //Home
              break;
            case 5:
              this.conn.send('\x1b[4~'); //End
              break;
            case 6:
              if(this.buf.nowHighlight!=-1)
              {
                if(this.buf.cur_y > this.buf.nowHighlight)
                {
                  count = this.buf.cur_y - this.buf.nowHighlight;
                  for(var i=0;i<count;++i)
                    sendstr+='\x1b[A'; //Arrow Up
                }
                else if(this.buf.cur_y < this.buf.nowHighlight)
                {
                  count = this.buf.nowHighlight - this.buf.cur_y;
                  for(var i=0;i<count;++i)
                    sendstr+='\x1b[B'; //Arrow Down
                }
                sendstr+='\r';
                this.conn.send(sendstr);
              }
              break;
            case 7:
              var pos = this.clientToPos(cX, cY);
              if(this.buf.cur_y > pos.row)
              {
                count = this.buf.cur_y - pos.row;
                for(var i=0;i<count;++i)
                  sendstr+='\x1b[A'; //Arrow Up
              }
              else if(this.buf.cur_y < pos.row)
              {
                count = pos.row - this.buf.cur_y;
                for(var i=0;i<count;++i)
                  sendstr+='\x1b[B'; //Arrow Down
              }
              sendstr+='\r';
              this.conn.send(sendstr);
              break;
            case 0:
              this.conn.send('\x1b[D'); //Arrow Left
              break;
            case 8:
              this.conn.send('['); //Previous post with the same title
              break;
            case 9:
              this.conn.send(']'); //Next post with the same title
              break;
            case 10:
              this.conn.send('='); //First post with the same title
              break;
            case 12:
              this.conn.send('\x1b[D\r\x1b[4~'); //Refresh post / pushed texts
              break;
            case 13:
              this.conn.send('\x1b[D\r\x1b[4~[]'); //Last post with the same title (LIST)
              break;
            case 14:
              this.conn.send('\x1b[D\x1b[4~[]\r'); //Last post with the same title (READING)
              break;
            default:
              //do nothing
              break;
          }
      /*
          break;
        case 3://READING
          break;
        default:
          break;
      }
      */
    },

    resetStatusBar: function(){
      //when view change, link url may be remove, we need updata statusbar.
      this.sendCoreCommand({command: "resetStatusBar"});
    },

    onMouse_move: function(cX, cY){
      var pos = this.clientToPos(cX, cY);
      this.buf.onMouse_move(pos.col, pos.row, false);
    },

    resetMouseCursor: function(cX, cY){
      this.buf.BBSWin.style.cursor = 'auto';
      this.buf.mouseCursor = 11;
    },

    clearHighlight: function(){
      this.buf.clearHighlight();
    },

    siteSettingCheck: function() {
      this.view.pictureWindow.style.display = 'none';
      this.CmdHandler.setAttribute('LastPicAddr','');
      var browserutils = new BBSFoxBrowserUtils();
      //we should change title, if ssh connection, add (SSH).
      document.title = browserutils.findSiteTitle(document.location.hostname, document.location.port ? document.location.port : BBSFOX_DEFAULT_PORT);
      if(bbsfox.isDefaultPref != browserutils.isDefaultPref)
      {
        bbsfox.prefListener.unregister();
        bbsfox.prefListener = browserutils.prefListener(function(branch, name) {
          bbsfox.prefs.onPrefChange(bbsfox, branch, name);
        }, bbsfox.prefs);
        bbsfox.isDefaultPref = browserutils.isDefaultPref;
        bbsfox.siteAuthInfo = browserutils.siteAuthInfo;
      }
    },

    doSiteSettingCheck: function(t) {
        if(this.settingCheckTimer)
          this.settingCheckTimer.cancel();
        var _this=this;
        var func=function() {
                _this.settingCheckTimer = null;
                _this.siteSettingCheck();
        };
        this.settingCheckTimer = setTimer(false, func, t);
    },

    cancelDownloadAndPaste: function() {
      var rtn = false;
      if(this.DelayPasteBuffer != '' || this.DelayPasteIndex != -1)
      {
        this.DelayPasteBuffer = '';
        this.DelayPasteIndex = -1;
        this.view.showAlertMessageEx(false, true, false, this.getLM('delayPasteStop'));
        rtn=true;
      }
      var downloadArticle = this.robot.downloadArticle;
      if(downloadArticle.isDownloading()) {
        downloadArticle.stopDownload();
        this.view.doBlink = true;
        rtn=true;
      }
      return rtn;
    },

    execExtMouseFunction: function(func) {
        if(func==1)
          this.conn.send('\r');
        else if(func==2)
        {
          this.buf.SetPageState();
          if(this.buf.PageState==2 || this.buf.PageState==3 || this.buf.PageState==4)
            this.conn.send('\x1b[D');
        }
        else if(func==6)
        {
          this.conn.send('\x1b[4~');//end
        }
        else if(func==8)
        {
          this.conn.send('\x1b[D\r\x1b[4~');//space
        }
        else if(func==7)
        {
          this.conn.send(' ');//space
        }
        else if(func==3) //copy
        {
          if(!window.getSelection().isCollapsed)
            this.doCopySelect();
          this.setInputAreaFocus();
        }
        else if(func==4) //paste
        {
          this.doPaste();
        }
        else if(func==5) //copy/paste
        {
          if(window.getSelection().isCollapsed)
            this.doPaste();
          else
            this.doCopySelect();
          this.setInputAreaFocus();
        }
    },

    mouse_click: function(event) {
      var skipMouseClick = (this.CmdHandler.getAttribute('SkipMouseClick')=='1');
      this.CmdHandler.setAttribute('SkipMouseClick','0');
      if(this.cancelDownloadAndPaste())
        return;
      if(event.button==2) //right button
      {
      }
      else if(event.button==0) //left button
      {
        if(this.prefs.useMouseBrowsing) {
          this.setDblclickTimer();
        }
        if(event.target && event.target.getAttribute("link")=='true')
        {
          //try to find out ancher node and get boardName.
          //if boardName == current boardname, jump to other board
          if(this.prefs.aidAction!=0 && this.prefs.aidAction!=1) {
            var aNode = event.target;
            if(aNode.parentNode && aNode.parentNode.nodeName == 'A') {
              aNode = aNode.parentNode;
            } else if(aNode.parentNode && aNode.parentNode.parentNode && aNode.parentNode.parentNode.nodeName == 'A') {
              aNode = aNode.parentNode.parentNode;
            } else {
              aNode = null;
            }
            if(aNode) {
              var boardName = aNode.getAttribute("boardName");
              var aidc = aNode.getAttribute("aidc");
              if(aidc && boardName) {
                var sendCode = '';
                //if(boardName == this.buf.boardName) {
                //  sendCode='#'+aidc+'\r';
                //} else {
                  sendCode='\x1b[Ds'+boardName+'\r#'+aidc+'\r';
                //}
                if(this.prefs.aidAction == 3)
                  sendCode+='\r';
                this.conn.send(sendCode);
                event.stopPropagation();
                event.preventDefault();
              }
            }
          } else if(this.prefs.aidAction==1 && this.prefs.loadURLInBG){
              this.bgtab(event);
          }
          return;
        }
        if(window.getSelection().isCollapsed) //no anything be select
        {
          if(this.prefs.useMouseBrowsing)
          {
            var doMouseCommand = true;
            if(event.target.className)
              if(event.target.classList.contains('extUI'))
                doMouseCommand = false;
            if(event.target.tagName)
              if(event.target.tagName.indexOf("menuitem") >= 0 )
                doMouseCommand = false;
            if(skipMouseClick)
            {
              doMouseCommand = false;
              var pos = this.clientToPos(event.clientX, event.clientY);
              this.buf.onMouse_move(pos.col, pos.row, true);
            }
            if(doMouseCommand)
            {
                this.onMouse_click(event.clientX, event.clientY);
                //this.setDblclickTimer();
                event.preventDefault();
                this.setInputAreaFocus();
            }
          }
        }
      }
      else if(event.button==1) //middle button
      {
        if(event.target && event.target.parentNode)
        {
          if(event.target.getAttribute("link")=='true')
            return;
        }
        this.execExtMouseFunction(this.prefs.middleButtonFunction);
      }
      else
      {
      }
    },

    mouse_down_init: function(event) {
      if(event.button == 2) {//right button
        this.lastEventTarget = event.originalTarget;
        this.prefs.updateOverlayPrefs([{key:'mouseOnPicWindow', value:false}]);
      }
    },

    mouse_down: function(event) {
      //0=left button, 1=middle button, 2=right button
      if(event.button==0)
      {
        this.mouseLeftButtonDown = true;
        //this.setInputAreaFocus();
        if(!(window.getSelection().isCollapsed))
          this.CmdHandler.setAttribute('SkipMouseClick','1');

        var onbbsarea = true;
        if(event.target.className)
          if(event.target.classList.contains('extUI'))
            onbbsarea = false;
        if(event.target.tagName)
          if(event.target.tagName.indexOf("menuitem") >= 0 )
            onbbsarea = false;
        // Press left key for 1 sec
        this.cancelMouseDownTimer();
        //this.mouseDownTimeout = false;
        if(window.getSelection().isCollapsed && this.prefs.useMouseBrowsing && this.prefs.useMouseBrowseSendEnter && onbbsarea) {
          var _this = this;
          var func = function() {
            if(_this.mouseLeftButtonDown && window.getSelection().isCollapsed)
              _this.conn.send(_this.prefs.EnterChar);
            _this.mouseDownTimer = null;
            _this.CmdHandler.setAttribute('SkipMouseClick','1');
          };
          this.mouseDownTimer = setTimer(false, func, 1000);
        }
      }
      else if(event.button==2)
      {
      }
    },

    mouse_up: function(event) {
      //0=left button, 1=middle button, 2=right button
      if(event.button==0)
      {
        var prefs = this.prefs;
        this.cancelMouseDownTimer();
        this.setMbTimer();
        //this.CmdHandler.setAttribute('MouseLeftButtonDown', '0');
        this.mouseLeftButtonDown = false;
        if(!window.getSelection().isCollapsed && prefs.enableBlacklist && prefs.overlayPrefs.blacklistMenu) {

          //check blacklist id
          var selstr = window.getSelection().toString().toLowerCase();
          if(selstr && selstr.indexOf('\n') == -1) {
            selstr = selstr.replace(/^\s+|\s+$/g,'');
            var userid = '';
            var selection = this.view.getSelectionColRow();
            //if(selection.start.row)
            var rowText = this.buf.getRowText(selection.start.row, 0, this.buf.cols);
            if (this.buf.PageState == 3 && this.isPTT()) {
              userid = parsePushthreadForUserId(rowText);
            } else if (this.buf.PageState == 2) {
              userid = parseThreadForUserId(rowText);
            }
            var addToBlacklist = false;
            var removeFromBlacklist = false;
            if (userid && selstr == userid) {
              if( prefs.blacklistedUserIds.indexOf(userid) == -1 ) {
                //not in blacklist, show item 'add to blacklist'
                addToBlacklist = true;
              } else {
                //in blacklist, show item 'remove from blacklist'
                removeFromBlacklist = true;
              }
            }
            prefs.updateOverlayPrefs([{key:'addToBlacklist', value:addToBlacklist}, {key:'removeFromBlacklist', value:removeFromBlacklist}]);
          }
        }
      }
      else if(event.button==2)
      {
        //this.mouseRightButtonDown = false;
        //this.CmdHandler.setAttribute('MouseRightButtonDown', '0');
      }
      if(event.button==0 || event.button==2) //left or right button
      {
          if(window.getSelection().isCollapsed) //no anything be select
          {
            if(this.prefs.useMouseBrowsing)
              this.onMouse_move(event.clientX, event.clientY);

            this.setInputAreaFocus();
            if(event.button==0)
            {
              var preventDefault = true;
              if(event.target.className)
                if(event.target.classList.contains('extUI'))
                  preventDefault = false;
              if(event.target.tagName)
                if(event.target.tagName.indexOf("menuitem") >= 0 )
                  preventDefault = false;
              if(preventDefault)
                event.preventDefault();
            }
          }
          else //something has be select
          {
            //document.getElementById('t').disabled="disabled"; //prevent input area get focus, if it get focus, select area will disappear
            //bbsfox.clearHighlight(); don't do this
            //document.getElementById('t').focus(); // if re-set focuse to input area, select area will disappear
          }
      }
      else
      {
        if(event.button==1 && (this.prefs.middleButtonFunction==3 || this.prefs.middleButtonFunction==5))
        {
        }
        else
        {
          this.setInputAreaFocus();
        }
        event.preventDefault();
      }
    },

    mouse_move: function(event) {
      this.view.tempPicX = event.clientX;
      this.view.tempPicY = event.clientY;
      //if we draging window, pass all detect.
      var dW = null;
      if(this.playerMgr && this.playerMgr.dragingWindow)
      {
        dW = this.playerMgr.dragingWindow;
        if(this.CmdHandler.getAttribute("DragingWindow")=='1') {
          dW.playerDiv.style.left = dW.tempCurX + (event.pageX - dW.offX) + 'px';
          dW.playerDiv.style.top = dW.tempCurY + (event.pageY - dW.offY) + 'px';
          event.preventDefault();
          return;
        }
        else if(this.CmdHandler.getAttribute("DragingWindow")=='2') {
          dW.playerDiv2.style.left = dW.tempCurX + (event.pageX - dW.offX) + 'px';
          dW.playerDiv2.style.top = dW.tempCurY + (event.pageY - dW.offY) + 'px';
          event.preventDefault();
          return;
        }
      }
      else if(this.picViewerMgr && this.picViewerMgr.dragingWindow)
      {
        dW = this.picViewerMgr.dragingWindow;
        dW.viewerDiv.style.left = dW.tempCurX + (event.pageX - dW.offX) + 'px';
        dW.viewerDiv.style.top = dW.tempCurY + (event.pageY - dW.offY) + 'px';
        event.preventDefault();
        return;
      }
      else if(this.symbolinput && this.symbolinput.dragingWindow)
      {
        dW = this.symbolinput.dragingWindow;
        if(this.CmdHandler.getAttribute("DragingWindow")=='3') {
          dW.mainDiv.style.left = dW.tempCurX + (event.pageX - dW.offX) + 'px';
          dW.mainDiv.style.top = dW.tempCurY + (event.pageY - dW.offY) + 'px';
          event.preventDefault();
          return;
        }
      }
      else if(this.ansiColorTool && this.ansiColorTool.dragingWindow)
      {
        dW = this.ansiColorTool.dragingWindow;
        if(this.CmdHandler.getAttribute("DragingWindow")=='4') {
          dW.mainDiv.style.left = dW.tempCurX + (event.pageX - dW.offX) + 'px';
          dW.mainDiv.style.top = dW.tempCurY + (event.pageY - dW.offY) + 'px';
          event.preventDefault();
          return;
        }
      }
      //
      if(event.target.className)
      {
        if(event.target.className.indexOf("q")>=0){
          if(this.prefs.enablePicturePreview && (this.prefs.ctrlPicturePreview==false || (this.prefs.ctrlPicturePreview && event.ctrlKey)  ) )
          {
            //if(e.target.rel.toLowerCase() == "p")
            var url = null;// = event.target.parentNode.getAttribute("href");
            var hrel = null;// = event.target.parentNode.getAttribute("rel");
            var node = event.target;
            if(node.getAttribute("link")=='true')
            {
              while(node.parentNode && !url)
              {
                node = node.parentNode;
                url = node.getAttribute("href");
                hrel = node.getAttribute("rel");
                this.view.hoverUrl = true;
                this.view.tempUrl = url;
              }
            }
            else
            {
              this.view.hoverUrl = false;
            }

            if(hrel && hrel.toLowerCase()=='p'
              && url.toLowerCase().indexOf("http://photo.xuite.net/")<0
              && url.toLowerCase().indexOf("http://simplest-image-hosting.net/")<0
              && url.toLowerCase().indexOf("http://screensnapr.com/")<0)
            {
              this.showPicPreview(url, url);
            }
            else if(url)
            {
              if(!this.extPicLoader.load(url))
                this.view.pictureWindow.style.display = "none";
            }
          }
        }
        //fix bug while no m o u s e o u t event to hide img
        else// if(e.target.tagName.toLowerCase() == "img")
        {
          this.view.pictureWindow.style.display = "none";
        }
      }//end of if(e.target.className)

      if(this.prefs.useMouseBrowsing)
      {
        this.cancelDblclickTimer(true);
        if(window.getSelection().isCollapsed)
        {
          if(!this.mouseLeftButtonDown)
            this.onMouse_move(event.clientX, event.clientY);
        }
        else
          this.resetMouseCursor();
      }
    },

    showPicPreview: function(linkUrl, picUrl) {
      if(!this.view.hoverUrl)
        return;
      if(this.view.tempUrl != linkUrl)
        return;
      this.setPicLocation(this.view.tempPicX, this.view.tempPicY);
      this.view.pictureWindow.style.display = "block";
      if(this.CmdHandler.getAttribute('LastPicAddr') == linkUrl){
        //if(this.prefs.picturePreviewInfo)
        //  this.view.pictureInfoLabel.style.display='inline';
        //else
        //  this.view.pictureInfoLabel.style.display='none';
      }else{
        //this.view.picturePreview.innerHTML = "";
        while (this.view.picturePreview.firstChild) this.view.picturePreview.removeChild(this.view.picturePreview.firstChild);
        this.view.picturePreview.style.display = "none";
        this.view.pictureInfoLabel.style.display = "none";
        this.view.picLoadingImage.src="chrome://bbsfox/skin/state_icon/connecting.gif";
        this.view.picturePreviewLoading.style.display = "block";
        this.CmdHandler.setAttribute('LastPicAddr', linkUrl);
        var image = document.createElement('img');
        this.view.picturePreview.appendChild(image);
        image.onload = function(){
          bbsfox.prePicResize(this);
        };
        image.onerror = function(){
          bbsfox.picLoaderror(this);
        };
        image.onclick = function(event){
          if(event.button==0 && bbsfox.prefs.picturePreviewClose)
          {
            bbsfox.CmdHandler.setAttribute('SkipMouseClick','1');
            bbsfox.view.pictureWindow.style.display = "none";
          }
        };
        image.setAttribute('src',picUrl);
      }
    },

    mouse_over: function(event) {
      if(window.getSelection().isCollapsed && !this.mouseLeftButtonDown)
        this.setInputAreaFocus();
    },

    mouse_dragstart: function(event) {
      this.DragText=true;
    },

    mouse_dragend: function(event) {
      this.DragText=false;
    },

    mouse_dragover: function(event) {
      this.cancelMouseDownTimer();
      var dt = event.dataTransfer;
      var isLink = dt.types.contains("text/uri-list");
      var isText = dt.types.contains("text/plain");
      var isFile = dt.types.contains("application/x-moz-file");
      //           dt.mozSetDataAt("application/x-moz-file", file, 0);
      //file: (1)text file, copy and paste file to BBS (not support yet)
      //      (2)binery file, auto upload to web HDD and return a link (not support yet)
      if (isLink || isText)
      {
        dt.dropEffect = "copy";
        event.preventDefault();
      }
      else if(isFile)
      {
        var file = dt.mozGetDataAt("application/x-moz-file", 0);
        if (file instanceof Components.interfaces.nsIFile)
        {
          //do default action(or we check 'xpi' for install, other for upload);
        }
        else
        {
          dt.dropEffect = "none";
          event.preventDefault();
        }
      }
      else
      {
        dt.dropEffect = "none";
        event.preventDefault();
      }
    },

    mouse_dragdrop: function(event) {
      var dt = event.dataTransfer;
      var isLink = dt.types.contains("text/uri-list");
      var isText = dt.types.contains("text/plain");
      //if URL or Text is a Youtube/UStream link, maybe we can open Player Window
      if(isLink || isText)
      {
        var str;
        if(isLink)
          str = dt.getData("URL");
        else if(isText)
          str = dt.getData("text/plain");
        if(this.prefs.epWhenDropLink)
        {
          if(this.youtubeRegEx.test(str))
          {
            this.playerMgr.openYoutubeWindow(str);
            event.preventDefault();
            this.setDelayInputAreaFocus();
            return;
          }
          else if(this.ustreamRegEx.test(str))
          {
            this.playerMgr.openUstreamWindow(str);
            event.preventDefault();
            this.setDelayInputAreaFocus();
            return;
          }
          else if(this.urecordRegEx.test(str))
          {
            this.playerMgr.openUrecordWindow(str);
            event.preventDefault();
            this.setDelayInputAreaFocus();
            return;
          }
        }
        if(this.prefs.dropToPaste)
          this.doPasteStr(str);
        event.preventDefault();
      }
      this.setDelayInputAreaFocus();
    },

    key_press: function(event) {
      if(!this.keyEventStatus)
        return;
      if(this.cancelDownloadAndPaste())
      {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if(event.charCode){
        // Control characters
        if(this.os=='Darwin') {
          if(event.metaKey && !event.altKey && !event.shiftKey && (event.charCode == 99 || event.charCode == 67) && !window.getSelection().isCollapsed && this.prefs.hokeyForCopy) { //^C , do copy
            this.doCopySelect();
            event.preventDefault();
            event.stopPropagation();
            return;
          }
        }

        if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode == 99 || event.charCode == 67) && !window.getSelection().isCollapsed && this.prefs.hokeyForCopy) { //^C , do copy
          this.doCopySelect();
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        else if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 99 || event.charCode == 67) && !window.getSelection().isCollapsed && this.prefs.hokeyForAnsiCopy) { //Shift + ^C , do ansi copy
          this.doAnsiCopySelect();
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode == 100 || event.charCode == 68) && this.prefs.hokeyForDownloadPost) { //^D , do download post
          if(this.prefs.hotkeyDownloadType==0)
          {
            this.ansiColor.file.savePage(0);
            //this.downloadPost(false,false,false);
          }
          if(this.prefs.hotkeyDownloadType==1)
          {
            this.ansiColor.file.savePage(1);
            //this.downloadPost(true,false,false);
          }
          else
          {
            this.ansiColor.file.savePage(2);
            //this.downloadPost(true,true,false);
          }
          event.preventDefault();
          event.stopPropagation();
        }
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode == 101 || event.charCode == 69) && this.prefs.hokeyForBgDisplay) { //^E , switch background display
          this.switchBgDisplay();
          event.preventDefault();
          event.stopPropagation();
        }
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode == 103 || event.charCode == 71) && this.prefs.hokeyForEasyReading) { //^G , easy reading mode
          this.ansiColor.file.openTab();
          //this.downloadPost(true,true,true);
          event.preventDefault();
          event.stopPropagation();
        }
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.charCode == 97 || event.charCode == 65) && this.prefs.hokeyForSelectAll){ //^A , do Select all
          this.doSelectAll();
          event.preventDefault();
          event.stopPropagation();
        }
        /* Adblock plus eat my key press event! move the event listener to overlay.
        else if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 118 || event.charCode == 86) && this.prefs.hokeyForPaste) { //Shift + ^V, do paste
          this.doPaste();
          event.preventDefault();
          event.stopPropagation();
        }*/
        else if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 113 || event.charCode == 81) && this.prefs.hokeyOpenThreadUrl) { //Shift + ^Q, do open thread url
          this.OpenThreadUrl();
          event.preventDefault();
          event.stopPropagation();
        }
        else if(event.ctrlKey && !event.altKey && event.shiftKey && (event.charCode == 122 || event.charCode == 90) && this.prefs.hokeyChangeColorTable) { //Shift + ^Z, do change color table
          this.view.changeColorTable();
          event.preventDefault();
          event.stopPropagation();
        }
        else if(!event.ctrlKey && event.altKey && !event.shiftKey && (event.charCode == 112 || event.charCode == 80) && this.prefs.hokey2ForPaste) { //Alt + P, do paste
          this.doPaste();
          event.preventDefault();
          event.stopPropagation();
        }
        /*
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && event.charCode == 46) { //Alt + ^+, do add Track word
          this.doAddTrack();
          event.preventDefault();
          event.stopPropagation();
        }
        else if(event.ctrlKey && !event.altKey && !event.shiftKey && event.charCode == 44) { //Alt + ^-, do del Track word
          this.doDelTrack();
          event.preventDefault();
          event.stopPropagation();
        }
        */
        if(window.getSelection().isCollapsed)
          this.setInputAreaFocus();
      }
      else
      {
        if(window.getSelection().isCollapsed)
          this.setInputAreaFocus();
      }
    },

    setPicLocation: function(curx, cury) {
      var bbswinwidth = parseFloat(this.buf.BBSWin.style.width);
      var bbswinheight = parseFloat(this.buf.BBSWin.style.height);
      var newleft;
      var newtop;
      if(curx + this.view.tempIamgeWidth < bbswinwidth)
        newleft = curx + 15;
      else
        newleft = curx - (this.view.tempIamgeWidth+5);

      if(newleft+this.view.tempIamgeWidth > bbswinwidth) newleft = bbswinwidth-this.view.tempIamgeWidth;
      if(newleft<0) newleft = 0;
      this.view.pictureWindow.style.left = newleft +"px";

      if(cury > this.view.tempIamgeHeight)
        newtop = cury - this.view.tempIamgeHeight;
      else
        newtop = cury + 5;

      if(newtop+this.view.tempIamgeHeight> bbswinheight) newtop = bbswinheight-this.view.tempIamgeHeight;
      if(newtop<0) newtop = 0;
      this.view.pictureWindow.style.top = newtop +"px";
    },

    picLoaderror: function(img) {
      if(this.view.pictureWindow.style.display == "block")
      {
        this.view.picLoadingImage.src="chrome://bbsfox/skin/state_icon/error.png";
        this.view.picturePreviewLoading.style.display = "block";
        this.view.picturePreview.style.display = "none";
        this.view.tempIamgeWidth = 40;
        this.view.tempIamgeHeight = 40;
      }
      else
      {
      }
      this.CmdHandler.setAttribute('LastPicAddr', '');
    },

    stringToNode: function(str) {
      var s = '<spen>'+str+'</spen>';
      var dp = new DOMParser();
      var doc = dp.parseFromString(s, "text/html");
      return doc.body.firstChild;
    },

    setChildByString: function(n, str) {
      var s = '<spen>'+str+'</spen>';
      var dp = new DOMParser();
      var doc = dp.parseFromString(s, "text/html");
      if(n.firstChild)
        n.replaceChild(doc.body.firstChild, n.firstChild);
      else
        n.appendChild(doc.body.firstChild);
    },

    prePicResize: function(img) {
      if(this.view.pictureWindow.style.display == "block")
      {
        this.view.picturePreviewLoading.style.display = "none";
        this.view.picturePreview.style.display = "block";
        //try naturalWidth/naturalHeight?
        var imgWidth = parseFloat(document.defaultView.getComputedStyle(img, null).width);
        var imgHeight = parseFloat(document.defaultView.getComputedStyle(img, null).height);
        var scale = 0;
        if(this.prefs.picturePreviewHeight>0)
          scale = imgHeight / this.prefs.picturePreviewHeight;
        if(scale > 1) {
          img.style.width = imgWidth / scale + "px";
          img.style.height = imgHeight / scale + "px";
          var s = imgWidth+' x '+imgHeight+' ('+ Math.floor(100 / scale) +'%)';
          this.setChildByString(this.view.pictureInfoLabel, s);
          //this.view.pictureInfoLabel.innerHTML=imgWidth+' x '+imgHeight+' ('+ Math.floor(100 / scale) +'%)';
          if(this.prefs.picturePreviewInfo)
            this.view.pictureInfoLabel.style.display='inline';
          this.view.tempIamgeWidth = (imgWidth / scale) +25;
          this.view.tempIamgeHeight = (imgHeight / scale) +25;
        }
        else{
          this.view.tempIamgeWidth = imgWidth+25;
          this.view.tempIamgeHeight = imgHeight+25;
          //var s = imgWidth+' x '+imgHeight+' (100%)';
          this.setChildByString(this.view.pictureInfoLabel, s);
          //this.view.pictureInfoLabel.innerHTML=imgWidth+' x '+imgHeight+' (100%)';
          if(this.prefs.picturePreviewInfo)
            this.view.pictureInfoLabel.style.display='inline';
        }
        this.setPicLocation(this.view.tempCurX, this.view.tempCurY);
      }
      else
      {
        this.CmdHandler.setAttribute('LastPicAddr', '');
      }
    },

    window_beforeunload: function(event){
      //event.returnValue = confirm('Are you sure you want to leave '+document.title+'?');
      event.returnValue = true;
      return document.title;
    },

    RegExitAlert: function(){
      this.UnregExitAlert();
      this.alertBeforeUnload = true;
      window.addEventListener('beforeunload', this.window_beforeunload, false);
    },

    UnregExitAlert: function(){
      // clear alert for closing tab
      if(this.alertBeforeUnload) {
        this.alertBeforeUnload = false;
        window.removeEventListener('beforeunload', this.window_beforeunload, false);
      }
    },

    bgtab: function (event){
      if(this.prefs.loadURLInBG)
      {
        if(event.target && event.target.getAttribute("link")=='true')
        {
            var aNode = event.target;
            if(aNode.parentNode && aNode.parentNode.nodeName == 'A') {
              aNode = aNode.parentNode;
            } else if(aNode.parentNode && aNode.parentNode.parentNode && aNode.parentNode.parentNode.nodeName == 'A') {
              aNode = aNode.parentNode.parentNode;
            } else {
              aNode = null;
            }
            if(aNode) {
              this.sendCoreCommand({command: "openNewTabs", charset: this.prefs.charset, ref: null, loadInBg: true, urls:[aNode.href]});
              event.stopPropagation();
              event.preventDefault();
            }
        }
      }
    },

    loadLoginData: function(){
      var ds, ss, url;
      if(document.location.protocol == 'telnet:') {
        ds = 'chrome://bbsfox2';
        ss = 'telnet://';
        url = this.isDefaultPref ? ds : ss + this.siteAuthInfo;
        this.sendCoreCommand({command: "loadAutoLoginInfo", querys: [{
                              protocol: "telnet",
                              url: url,
                              ds: ds}]});
      } else if(document.location.protocol == 'ssh:') {
        var querys = [];
        ds = 'chrome://bbsfox2';
        ss = 'telnet://';
        url = this.isDefaultPref ? ds : ss + this.siteAuthInfo;
        querys.push({protocol: "telnet", url: url, ds: ds})

        ds = 'chrome://bbsfox3';
        ss = 'ssh://';
        url = this.isDefaultPref ? ds : ss + this.siteAuthInfo;
        querys.push({protocol: "ssh", url: url, ds: ds})

        this.sendCoreCommand({command: "loadAutoLoginInfo", querys: querys});
      }
    },

    doPushThread: function(){
      if(this.isPTT())
      {
        var EMURL = "chrome://bbsfox/content/pushThread.xul";
        var EMFEATURES = "chrome, dialog=yes, resizable=yes, modal=yes, centerscreen";
        var retVals = { exec: false, pushText: this.pushTextTemp, lineLength: this.prefs.pushThreadLineLength};
        var retVals2 = [];
        window.openDialog(EMURL, "", EMFEATURES, retVals, retVals2);
        if(retVals.exec)
        {
          for(var i =0;i<retVals2.length;++i)
          {
            this.conn.convSend(retVals2[i], this.prefs.charset);
            this.conn.send(this.prefs.EnterChar+'y'+this.prefs.EnterChar);
          }
          this.pushTextTemp = '';
        }
        else
        {
          this.pushTextTemp = retVals.pushText;
        }
      }
    },

    OpenThreadUrl: function(){
      if(this.isPTT())
      {
        this.conn.blockSend = true;
        this.buf.openThreadUrl = 1;
        this.conn.backgroundSend('Q');
      }
    },

    addToBlacklist: function(){
      var selstr = window.getSelection().toString();
      selstr = selstr.replace(/^\s+|\s+$/g,'');
      var msg = '';
      var bundle = this.getLMBundle();
      if(this.isDefaultPref) {
        var siteStr = this.getLM("defaultSite");
        msg = bundle.formatStringFromName("addBlacklist",[selstr, siteStr], 2);
      } else {
        msg = bundle.formatStringFromName("addBlacklist",[selstr, document.title], 2);
      }
      var res = confirm(msg);
      if (res == true) {
        this.prefs.addToBlacklist(selstr);
      } else {
        //do nothing...
      }
    },

    removeFromBlacklist: function(){
      var selstr = window.getSelection().toString();
      selstr = selstr.replace(/^\s+|\s+$/g,'');
      var msg = '';
      var bundle = this.getLMBundle();
      if(this.isDefaultPref) {
        var siteStr = this.getLM("defaultSite");
        msg = bundle.formatStringFromName("removeBlacklist",[selstr, siteStr], 2);
      } else {
        msg = bundle.formatStringFromName("removeBlacklist",[selstr, document.title], 2);
      }
      var res = confirm(msg);
      if (res == true) {
        this.prefs.removeFromBlacklist(selstr);
      } else {
        //do nothing...
      }
    },

    disableKeyEvent: function(){
      this.keyEventStatus = false;
      this.prefs.updateEventPrefs([{key:'keyEventStatus', value:false}]);
    },

    enableKeyEvent: function(){
      this.view.input.value='';
      this.keyEventStatus = true;
      this.prefs.updateEventPrefs([{key:'keyEventStatus', value:true}]);
    },

    fixUnicode: function(fix, change){
      var cssele = document.getElementById('ColorFix');
      if(fix) {
        cssele.setAttribute('href', 'chrome://bbsfox/skin/color-fix.css');
        for(var i=0;i<this.buf.rows;++i)
          this.view.BBSROW[i].style.display='block';
      } else {
        cssele.setAttribute('href', 'chrome://bbsfox/skin/color-normal.css');
        for(var i=0;i<this.buf.rows;++i)
          this.view.BBSROW[i].style.display='inline';
      }
      this.view.update(true);
    },

    observe: function(subject, topic, data){
      if(topic == "alertclickcallback")
      {
        //TODO:switch to notify tab
      }
    }
};
