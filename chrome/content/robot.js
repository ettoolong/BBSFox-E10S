function Robot(listener) {
    this.listener = listener;
    this.prefs = listener.prefs;
    //this.replyCount = [];
    this.autoLoginStage=0;
    this.downloadArticle = new DownloadArticle(listener);
}

Robot.prototype={
    /*
    hasAutoReply: function() {
        for(var i=0; i<5; ++i) {
            if(this.listener.prefs['ReplyPrompt' + i] &&
            this.listener.prefs['ReplyString' + i])
                return true;
        }
        return false;
    },

    checkAutoReply: function(row) {
        var line = this.listener.buf.getRowText(row, 0, this.listener.buf.cols);
        var Encoding = this.listener.prefs.Encoding;
        for(var i=0; i<5; ++i) {
            //FIXME: implement the UI of limiting the number of reply times
            // Reset the count if the strings change?
            var replyStart = 1; // this.listener.prefs.['ReplyStart' + i];
            var replyLimit = 1; // this.listener.prefs.['ReplyLimit' + i];

            var replyPrompt =
                this.listener.prefs['ReplyPrompt' + i];
            var replyString =
                UnEscapeStr(this.listener.prefs['ReplyString' + i]);
            if(!this.replyCount[i])
                this.replyCount[i] = 0;

            if(!replyPrompt) // Stop auto-reply without prompt string
                continue;

            if(line.indexOf(replyPrompt) < 0) // Not found
                continue;

            ++this.replyCount[i];

            if(this.replyCount[i] < replyStart)
                continue;

            // setting the limit as negative numbers means unlimited
            if(replyLimit >= 0 && this.replyCount[i] >= replyStart + replyLimit)
                continue;

            this.listener.conn.convSend(replyString, Encoding);
            break; // Send only one string at the same time
        }
    },
    */
    // Modified from pcmanx-gtk2
    initialAutoLogin: function(result) {
        //var acc = this.listener.loadLoginData('chrome://bbsfox2','telnet://'); //load login data
        this.prefs.loginStr[1] = result.telnet.userName;
        this.prefs.loginStr[2] = result.telnet.password;

        if(this.prefs.loginStr[1])
            this.autoLoginStage = this.prefs.loginStr[0] ? 1 : 2;
        else if(this.prefs.loginStr[2]) this.autoLoginStage = 3;
        else this.autoLoginStage = 0;
    },

    // Modified from pcmanx-gtk2
    checkAutoLogin: function(row) {
        if(this.autoLoginStage > 3 || this.autoLoginStage < 1) {
          this.autoLoginStage = 0;
          return;
        }

        var line = this.listener.buf.getRowText(row, 0, this.listener.buf.cols);
        if(line.indexOf(this.prefs.loginPrompt[this.autoLoginStage - 1]) < 0)
          return;

        var Encoding = this.prefs.charset;
        var EnterKey = this.prefs.EnterChar;
        //this.send(this.convSend(this.prefs.loginStr[this.autoLoginStage-1] + this.prefs.EnterChar, Encoding, true));
        this.listener.conn.convSend(this.prefs.loginStr[this.autoLoginStage - 1] + EnterKey, Encoding);

        if(this.autoLoginStage == 3) {
          if(this.prefs.loginStr[3])
            this.listener.conn.convSend(this.prefs.loginStr[3], Encoding);
          this.autoLoginStage = 0;
          return;
        }
        ++this.autoLoginStage;
    }
};

function DownloadArticle(listener) {
    this.listener = listener;
    this.ansi = listener.ansiColor;
    this.prefs = listener.prefs;
    this.timer = null;
    this.interval = 200; // in mini second
    this.isLineFeed = false;
    this.article = [];
    this.callback = null;
}

DownloadArticle.prototype={
    finishTest: /\d%/i,

    finishCallback: function(callback) {
        if(this.isDownloading())
            this.stopDownload();
        this.callback = callback;
    },

    // Modified from pcmanx-gtk2
    startDownloadEx: function(saveMode) {
        if(this.prefs.downloadFullPost)
        {
            this.listener.buf.SetPageState();
            if(this.listener.buf.PageState==3)
            {
              var buf = this.listener.buf;
              var text = buf.getRowText(buf.rows-1, 0, buf.cols);
              if(text.indexOf("(g)") >= 0 && text.indexOf("(aA)") >= 0) //gamer thread end
                this.listener.conn.send('\x1b[D\r'); //left then enter
              else
                this.listener.conn.send('\x1b[1~'); // home
              var _this=this;
              this.timer = setTimer(false, function(){
                _this.timer.cancel();
                _this.timer = null;
                _this.startDownload(saveMode);
              }, 500);
              return;
            }
            else
              this.startDownload(saveMode);
        }
        else
          this.startDownload(saveMode);
    },

    startDownload: function(saveMode) {
        if(this.isDownloading())
            this.stopDownload();

        this.listener.view.doBlink = false;
        this.listener.view.blinkOn = true;
        this.listener.view.update(false);

        for(var row = 0; row < this.listener.buf.rows-1; ++row) {
            var text;
            if(saveMode == 2)
              text = '<span class="BBSLine">'+this.listener.view.BBSROW[row].innerHTML+'</span>';
            else if(saveMode == 0)
              text = this.listener.buf.getText(row, 0, this.listener.buf.cols, false, true, false);
            else
              text = this.ansi.getText(row, 0, this.listener.buf.cols, false);
            this.article.push(text);
        }
        if(this.checkFinish(saveMode))
          return;
        this.listener.conn.send('\x1b[B');
        var _this = this;
        this.timer = setTimer(true, function() {
            if(!_this.checkNewLine(saveMode))
                return;
            if(!_this.checkFinish(saveMode))
                _this.listener.conn.send('\x1b[B');
        }, this.prefs.downloadLineDelay);
    },

    // Modified from pcmanx-gtk2
    checkNewLine: function(saveMode) {
        var buf = this.listener.buf;
        if(!this.isLineFeed || buf.row < buf.rows-1 || buf.col < 40)
            return false; // not fully received

        var text, lastline;
        if(saveMode == 2) {
          text = '<span class="BBSLine">'+this.listener.view.BBSROW[buf.rows-2].innerHTML+'</span>';
          lastline = '<span class="BBSLine">'+this.listener.view.BBSROW[buf.rows-3].innerHTML+'</span>';
        } else if(saveMode == 0) {
          text = buf.getText(buf.rows-2, 0, buf.cols, false, true, false);
          lastline = buf.getText(buf.rows-3, 0, buf.cols, false, true, false);
        } else {
          text = this.ansi.getText(buf.rows-2, 0, buf.cols, false);
          lastline = this.ansi.getText(buf.rows-3, 0, buf.cols, false);
        }
        // Hack for the double-line separator of PTT
        // Not always works, such as that repeated lines may not be detected
        // disabling double-line separator is recommended
        var downloaded = this.article[this.article.length-1];
        if(downloaded != lastline) {
            var lastlastline;
            if(saveMode == 2) {
              lastlastline = '<span class="BBSLine">'+this.listener.view.BBSROW[buf.rows-4].innerHTML+'</span>';
            } else if(saveMode == 0) {
              lastlastline = buf.getText(buf.rows-4, 0, buf.cols, false, true, false);
            } else {
              lastlastline = this.ansi.getText(buf.rows-4, 0, buf.cols, false);
            }
            if(downloaded == lastlastline)
            {
              this.article.push(lastline);
            }
        }
        this.article.push(text);
        this.isLineFeed = false;
        return true;
    },

    // Modified from pcmanx-gtk2
    checkFinish: function(saveMode) {
        var buf = this.listener.buf;
        var text = buf.getRowText(buf.rows-1, 0, buf.cols);
        if(this.finishTest.test(text)) {
          if(text.indexOf("100%") < 0)
            return false;
        }

        var text2;
        if(saveMode == 2)
          text2 = '<span class="BBSLine">'+this.listener.view.BBSROW[this.listener.buf.rows-1].innerHTML+'</span>';
        else if(saveMode == 0) {
          text2 = buf.getText(buf.rows-1, 0, buf.cols, false, true, false);
        } else
          text2 = this.ansi.getText(buf.rows-1, 0, buf.cols, false);
        this.article.push(text2);
        this.listener.view.doBlink = true;

        var data = this.article.join('\r\n');
        this.stopDownload(true);

        if(saveMode == 0) {
          data = data.replace(/\x1b\[[0-9;]*m/g, '');
          if(this.listener.prefs.TrimTail)
            data = data.replace(/ +\r\n/g, '\r\n');
          if(this.listener.os != 'WINNT') // handle CRLF
            data = data.replace(/\r\n/g, '\n');
          this.callback(data);
        } else if(saveMode == 1) {
          this.callback(data);
        }
        else if(saveMode == 2)
        {
          var doc = (new DOMParser()).parseFromString(data, "text/html");
          var queueCount = 0;
          var done = function() {
            if(queueCount>0)
              queueCount--;
            if(queueCount === 0) {
              data = this.getHtmlHeader() + doc.body.innerHTML + this.getHtmlTail();
              this.callback(data);
            }
          };
          var allLinks = doc.getElementsByTagName("a");
          for(let anchorNode of allLinks) {
            if(this.prefs.easyReadingWithImg) {
              queueCount += this.createImageTag(doc, anchorNode, done.bind(this));
            }
            if(this.prefs.easyReadingWithVideo) {
              this.createVideoTag(doc, anchorNode);
            }
          }
          if(queueCount === 0)
            done.bind(this)();
        }
        return true;
    },

    stopDownload: function(normal) {
        this.listener.view.doBlink = true;
        this.isLineFeed = false;
        this.article = [];
        if(!this.isDownloading())
            return;
        if(!normal) {
          this.listener.view.showAlertMessageEx(false, true, false, this.listener.getLM('alert_down_terminate'));
        }
        else{
          this.listener.view.showAlertMessageEx(false, true, false, this.listener.getLM('alert_down_finish'));
        }

        this.timer.cancel();
        this.timer = null;
    },

    isDownloading: function() {
        return (this.timer != null);
    },

    getLineFeed: function() {
        this.isLineFeed = true;
    },

    getHtmlHeader: function() {
      var selstr='';
      var fontFace = this.prefs.fontFace;
      if(fontFace=="")
        fontFace = "MingLiu";
      var bgcolor = (this.listener.view.colorTable==0) ? this.prefs.bbsColor[0] : this.listener.view.invertColor(this.prefs.bbsColor[0]);

      selstr = '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style type="text/css">';
      selstr += '.main {font-family: ';
      selstr += fontFace;
      selstr += ';font-size: ';
      selstr += this.listener.view.chh;
      selstr += 'px;background-color:' + bgcolor + ';line-height: 100%; margin: 0px;textAlign:';
      selstr += this.listener.view.mainDisplay.style.textAlign;
      selstr += ';width:';
      selstr += this.listener.view.mainDisplay.style.width;
      selstr += ';}body{color:white;background-color:' + bgcolor + ';margin:0px;}img.scale{max-width:98%;}img.max{max-width:none;}';
      if(!this.prefs.easyReadingWithImg)
        selstr += 'a,a:link,a:visited,a:active,a:hover{border-bottom: 1px solid #FF6600;text-decoration:none;}';
      selstr += '#BBSWindow{position:relative;}';
      selstr += this.listener.getMainCssDefine();
      selstr += '</style>';
      if(this.prefs.easyReadingWithImg ||this.prefs.preventNewTongWenAutoConv)
      {
        selstr += '<script type="text/javascript">function loadpage(){';
        if(this.prefs.preventNewTongWenAutoConv)
          selstr +='var tongwen=document.getElementById("tongwen_font");if(tongwen!=null)tongwen.parentNode.removeChild(tongwen);';
        if(this.prefs.easyReadingWithImg)
          selstr +='var switchSize = {view:this,handleEvent: function(e) {if(e.target.getAttribute("class")=="scale"){e.target.setAttribute("class", "max");}else{e.target.setAttribute("class", "scale");}}};var allLinks = document.querySelectorAll("img.scale");for(let anchorNode of allLinks) {anchorNode.addEventListener("click", switchSize, false);}';
        selstr +='}</script>';
      }
      selstr += '</head><body';
      if(this.prefs.easyReadingWithImg || this.prefs.preventNewTongWenAutoConv)
        selstr += ' onload="loadpage()"';
      selstr += '><div id="BBSWindow"><div id="main" class="main">';
      return selstr;
    },

    getHtmlTail: function() {
      return '</div></div>' + this.prefs.easyReadingWithImg ? '<div id="bbsfox_em" style="display:none"/>' : '' + '</body></html>';
    },

    createImageTag: function(doc, anchorNode, done) {
        var url = anchorNode.getAttribute("href");
        var hrel = anchorNode.getAttribute("rel");
        var ignoreList = ['http://photo.xuite.net/',
                          'http://simplest-image-hosting.net/',
                          'http://screensnapr.com/',
                          'https://www.dropbox.com'];

        if(!hrel)
          return 0;
        if(bbsfox.extPicLoader.query(url)) {
          //
        } else if(hrel.toLowerCase() !== "p") {
          return 0;
        }

        for(let i of ignoreList) {
          if(url.toLowerCase().indexOf(i) !== -1) {
            return 0;
          }
        }

        var srcdom = anchorNode.parentNode;
        while(!srcdom.classList.contains('BBSLine')) {
          srcdom = srcdom.parentNode;
        }
        var pn = srcdom.parentNode;
        var node = srcdom.nextSibling.nextSibling;
        var div;
        if( !node.classList.contains("AddLine") ) {
          div = doc.createElement("div");
          div.setAttribute("class", "AddLine");
          pn.insertBefore(div, srcdom.nextSibling);
        } else {
          div = node;
        }
        var br = doc.createElement("BR");
        div.appendChild(br);
        var img = doc.createElement("img");
        div.appendChild(img);
        img.setAttribute("class", "scale");
        if(bbsfox.extPicLoader.query(url, function(realUrl){img.setAttribute("src", realUrl);done();})) {
          return 1;
        } else {
          img.setAttribute("src", url);
          return 0;
        }
    },

    createVideoTag: function(doc, anchorNode) {
      var url = anchorNode.getAttribute("href");
      var youtubeRegEx1 = /https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([A-Za-z0-9._%-]*)/i;
      var youtubeRegEx2 = /https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*)/i;

      var code;
      if(youtubeRegEx1.test(url)) {
        var res = youtubeRegEx1.exec(url);
        code = res[1];
      } else if(youtubeRegEx2.test(url)) {
        var res = youtubeRegEx2.exec(url);
        code = res[1];
      } else {
        return;
      }
      var srcdom = anchorNode.parentNode;
      while(!srcdom.classList.contains('BBSLine')) {
        srcdom = srcdom.parentNode;
      }
      var pn = srcdom.parentNode;
      var node = srcdom.nextSibling.nextSibling;
      var div;
      if( !node.classList.contains("AddLine") ) {
        div = document.createElement("div");
        div.setAttribute("class","AddLine");
        pn.insertBefore(div, srcdom.nextSibling);
      } else {
        div = node;
      }
      var br = document.createElement("BR");
      div.appendChild(br);
      var iframe = document.createElement("iframe");
      div.appendChild(iframe);
      iframe.setAttribute("class","youtube-player");
      iframe.setAttribute("type","text/html");
      iframe.setAttribute("frameborder",0);

      var scrstr = "https://www.youtube.com/embed/"+code+"?hl=zh_TW&fs=1&rel=0&loop=0&autoplay=0";
      iframe.setAttribute("width",560);
      iframe.setAttribute("height",340);
      iframe.setAttribute("src",scrstr);
    }
};
