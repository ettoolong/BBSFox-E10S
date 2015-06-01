function BBSOverlayCmdListener(listener) {
  this.bbscore = listener;
  //TODO: This module handle command from overlay.
  //If we can handle FireGesture command at here, we can delete gesturehandler.js
}

BBSOverlayCmdListener.prototype={
  exec: function(data){
    var bbscore = this.bbscore;
        switch (data.command) {
          case "doArrowUp":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[A');
            break;
          case "doArrowDown":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[B');
            break;
          case "doPageUp":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[5~');
            break;
          case "doPageDown":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[6~');
            break;
          case "doHome":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[1~');
            break;
          case "doEnd":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.conn.send('\x1b[4~');
            break;
          case "cancelHoldMouse":
            bbscore.cancelMouseDownTimer();
            break;
          case "prevousThread":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.buf.SetPageState();
            if(bbscore.buf.PageState==2 || bbscore.buf.PageState==3 || bbscore.buf.PageState==4)
            {
              bbscore.cancelMouseDownTimer();
              bbscore.conn.send('[');
            }
            break;
          case "nextThread":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.buf.SetPageState();
            if(bbscore.buf.PageState==2 || bbscore.buf.PageState==3 || bbscore.buf.PageState==4)
            {
              bbscore.cancelMouseDownTimer();
              bbscore.conn.send(']');
            }
            break;
          case "setInputAreaFocus":
            bbscore.setInputAreaFocus();
            break;
          case "doAddTrack":
            bbscore.doAddTrack();
            break;
          case "doDelTrack":
            bbscore.doDelTrack();
            break;
          case "doClearTrack":
            bbscore.doClearTrack();
            break;
          case "openSymbolInput":
            if(bbscore.symbolinput)
              bbscore.symbolinput.displayWindow();
            break;
          case "doSavePage":
            bbscore.doSavePage();
            break;
          case "doCopyHtml":
            bbscore.doCopyHtml();
            break;
          case "doSelectAll":
            bbscore.doSelectAll();
            break;
          case "doCopy":
            bbscore.doCopySelect();
            break;
          case "doCopyAnsi":
            bbscore.doAnsiCopySelect();
            break;
          case "doPaste":
            bbscore.doPaste();
            break;
          case "doDelayPasteText":
            bbscore.doDelayPasteText();
            break;
          case "doOpenAllLink":
            bbscore.doOpenAllLink();
            break;
          case "switchMouseBrowsing":
            bbscore.switchMouseBrowsing();
            break;
          case "switchBgDisplay":
            bbscore.switchBgDisplay();
            break;
          case "checkFireGestureKey":
            if(bbscore.cancelDownloadAndPaste())
              return;
            bbscore.gesture.checkFireGestureKey();
            break;
          case "openPlayerWindow":
            if(bbscore.playerMgr){
              if(data.videoType == "Y")
                bbscore.playerMgr.openYoutubeWindow(data.videoUrl);
              else if(data.videoType == "U")
                bbscore.playerMgr.openUstreamWindow(data.videoUrl);
              else if(data.videoType == "R")
                bbscore.playerMgr.openUrecordWindow(data.videoUrl);
            }
            break;
          case "previewPicture":
            if(bbscore.picViewerMgr)
              bbscore.picViewerMgr.openPicture(data.pictureUrl);
            break;
          case "doDownloadPost":
            bbscore.ansiColor.file.savePage(data.downloadColor);
            break;
          case "doLoadFile":
            bbscore.ansiColor.file.loadFile();
            break;
          case "doPasteFileData":
            bbscore.ansiColor.file.doPasteFileData(data.fileData);
            break;
          case "checkPrefExist":
            bbscore.doSiteSettingCheck(250);
            break;
          case "easyReading":
            bbscore.ansiColor.file.openTab();
            break;
          case "pushThread":
            bbscore.doPushThread();
            break;
          case "openThreadUrl":
            bbscore.OpenThreadUrl();
            break;
          case "changeColorTable":
            bbscore.ChangeColorTable();
            break;
          case "addToBlacklist":
            bbscore.addToBlacklist();
            break;
          case "removeFromBlacklist":
            bbscore.removeFromBlacklist();
            break;
          case "loginInfoReady":
            bbscore.robot.initialAutoLogin(data.result);
            bbscore.connect();
            break;
          case "setAlert":
            //bbscore.view.showAlertMessageEx(false, true, false, data.alertMessage);
            //alert(param);
            break;
          case "contextmenu":
            console.log("contextmenu");
            var evt = document.createEvent("MouseEvents");//fire event !
                evt.initMouseEvent("contextmenu", true, true, document.defaultView, 0,
                                    data.screenX, data.screenY, data.clientX, data.clientY,
                                    false, false, false, false, 2, null);
            if(bbscore.lastEventTarget)
              bbscore.lastEventTarget.dispatchEvent(evt);
            else
              document.getElementById('topwin').dispatchEvent(evt);
            //
            break;
          default:
            break;
        }
  }
};
