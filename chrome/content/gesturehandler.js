function BBSGestureHandler(listener) {
  this.bbscore = listener;
  this.prefs = listener.prefs;
  this.CmdHandler = listener.CmdHandler;
}

BBSGestureHandler.prototype={

    checkFireGestureKey: function() {
      var bbscore = this.bbscore;
      var doGesture = false;
      var actionkey = this.CmdHandler.getAttribute("FireGestureKey");
      this.CmdHandler.removeAttribute("FireGestureKey");
      if(actionkey==null)
        return;
      switch (actionkey) {
        case "Page Up":
          bbscore.conn.send('\x1b[5~');
          doGesture = true;
          break;
        case "Page Down":
          bbscore.conn.send('\x1b[6~');
          doGesture = true;
          break;
        case "End":
          bbscore.conn.send('\x1b[4~');
          doGesture = true;
          break;
        case "Home":
          bbscore.conn.send('\x1b[1~');
          doGesture = true;
          break;
        case "Arrow Left":
          bbscore.conn.send('\x1b[D');
          doGesture = true;
          break;
        case "Arrow Up":
          bbscore.conn.send('\x1b[A');
          doGesture = true;
          break;
        case "Arrow Right":
          bbscore.conn.send('\x1b[C');
          doGesture = true;
          break;
        case "Arrow Down":
          bbscore.conn.send('\x1b[B');
          doGesture = true;
          break;
        case "SymbolInput":
          if(bbscore.symbolinput)
          {
            bbscore.symbolinput.setCore(bbscore);
            bbscore.symbolinput.switchWindow();
          }
          doGesture = true;
          break;
        case "EmbeddedPlayer":
          if(bbscore.playerMgr){
            var param = this.CmdHandler.getAttribute("EPURL");
            this.CmdHandler.removeAttribute("EPURL");
            var testresult = bbscore.playerMgr.testURL(param);
            if(testresult==1)
              bbscore.playerMgr.openYoutubeWindow(param);
            else if(testresult==2)
              bbscore.playerMgr.openUstreamWindow(param);
            else if(testresult==3)
              bbscore.playerMgr.openUrecordWindow(param);
          }
          break;
        case "CloseEmbeddedPlayer":
          if(bbscore.playerMgr)
            bbscore.playerMgr.closeAllEmbededPlayer();
          break;
        case "MinimizeEmbeddedPlayer":
          if(bbscore.playerMgr)
            bbscore.playerMgr.minimizeAllEmbededPlayer();
          break;
        case "RestroeEmbeddedPlayer":
          if(bbscore.playerMgr)
            bbscore.playerMgr.restoreAllEmbededPlayer();
          break;
        case "OpenPictureViewer":
          if(bbscore.picViewerMgr)
          {
            var param = this.CmdHandler.getAttribute("PVURL");
            bbscore.picViewerMgr.openPicture(param);
          }
          break;
        case "ClosePictureViewer":
          if(bbscore.picViewerMgr)
            bbscore.picViewerMgr.closeAllPictureViewer();
          break;
        case "Copy":
          bbscore.doCopySelect();
          doGesture = true;
          break;
        case "AnsiCopy":
          bbscore.doAnsiCopySelect();
          doGesture = true;
          break;
        case "Paste":
          bbscore.doPaste();
          doGesture = true;
          break;
        case "DelayPasteText":
          bbscore.doDelayPasteText();
          doGesture = true;
          break;
        case "EasyReading":
          var _this = bbscore;
          setTimer(false, function(){_this.ansiColor.file.openTab();}, 10);
          doGesture = true;
          break;
        case "PushThread":
          bbscore.doPushThread();
          doGesture = true;
          break;
        case "OpenThreadUrl":
          bbscore.OpenThreadUrl();//let robot do this?
          doGesture = true;
          break;
        case "ChangeColorTable":
          bbscore.ChangeColorTable();
          doGesture = true;
          break;
        case "DownloadPostText":
          var _this = bbscore;
          setTimer(false, function(){_this.ansiColor.file.savePage(0);}, 10);
          doGesture = true;
          break;
        case "DownloadPostAnsi":
          var _this = bbscore;
          setTimer(false, function(){_this.ansiColor.file.savePage(1);}, 10);
          doGesture = true;
          break;
        case "DownloadPostHtml":
          var _this = bbscore;
          setTimer(false, function(){_this.ansiColor.file.savePage(2);}, 10);
          doGesture = true;
          break;
        case "LoadFile":
          bbscore.ansiColor.file.openFile();
          doGesture = true;
          break;
        case "SelectAll":
          bbscore.doSelectAll();
          doGesture = false;
          break;
        case "SavePage":
          bbscore.doSavePage();
          doGesture = true;
          break;
        case "OpenAllLink":
          bbscore.doOpenAllLink();
          doGesture = true;
          break;
        case "SwitchMouseBrowsing":
          bbscore.switchMouseBrowsing();
          doGesture = true;
          break;
        case "SwitchBgDisplay":
          bbscore.switchBgDisplay();
          doGesture = true;
          break;
        case "SendTextData":
          var actionkeyEx = this.CmdHandler.getAttribute("FireGestureKeyEx");
          this.CmdHandler.removeAttribute("FireGestureKeyEx");
          actionkeyEx=actionkeyEx.replace(/\r\n/g, '\r');
          actionkeyEx=actionkeyEx.replace(/\n/g, '\r');
          actionkeyEx=actionkeyEx.replace(/\r/g, this.prefs.EnterChar);
          bbscore.conn.convSend(actionkeyEx, this.prefs.charset);
          doGesture = true;
          break;
        default:
          if(actionkey.indexOf('codestr,')==0){
            bbscore.sendCodeStr(actionkey, 1);
          }
          else if(actionkey.indexOf('codestrEx,')==0)
          {
            var actionkeyEx = this.CmdHandler.getAttribute("FireGestureKeyEx");
            this.CmdHandler.removeAttribute("FireGestureKeyEx");
            var arr = actionkey.split(',');
            var arr2 = actionkeyEx.split(',');
            var searchStr = bbscore.getSelectStr();
            var table = bbscore.asciitable;
            for(var i=1;i<arr.length;i++){
              if(arr[i]!='')
              {
                if(arr[i].charCodeAt(0)==99) //char
                  bbscore.conn.convSend(arr[i].substr(1,arr[i].length), this.prefs.charset);
                else if(arr[i].charCodeAt(0)==120) //hexcode
                  bbscore.conn.send(arr[i].substr(1,arr[i].length));
                else if(arr[i].charCodeAt(0)==104) //hexcode
                {
                  if(code=table[arr[i].toLowerCase()])
                    bbscore.conn.send(code);
                }
              }
            }
            bbscore.conn.convSend(searchStr, this.prefs.charset);
            for(var i=1;i<arr2.length;i++){
              if(arr2[i]!=''){
                if(arr2[i].charCodeAt(0)==99) //char
                  bbscore.conn.convSend(arr2[i].substr(1,arr2[i].length), this.prefs.charset);
                else if(arr2[i].charCodeAt(0)==120) //hexcode
                  bbscore.conn.send(arr2[i].substr(1,arr2[i].length));
                else if(arr2[i].charCodeAt(0)==104) //hexcode
                {
                  if(code=table[arr2[i].toLowerCase()])
                    bbscore.conn.send(code);
                }
              }
            }
          }
          doGesture = true;
          break;
      }
      if(doGesture)
        bbscore.setInputAreaFocus();
    }
};
