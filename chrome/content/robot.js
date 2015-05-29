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
    initialAutoLogin: function() {
        var acc = this.listener.loadLoginData('chrome://bbsfox2','telnet://'); //load login data
        this.prefs.loginStr[1] = acc[0];
        this.prefs.loginStr[2] = acc[1];

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

        var text = this.ansi.getText(buf.rows-2, 0, buf.cols, false);
        var html, lastlinehtml;
        if(saveMode==2)
          html = '<span class="BBSLine">'+this.listener.view.BBSROW[buf.rows-2].innerHTML+'</span>';
        // Hack for the double-line separator of PTT
        // Not always works, such as that repeated lines may not be detected
        // disabling double-line separator is recommended
        var downloaded = this.article[this.article.length-1];
        var lastline = this.ansi.getText(buf.rows-3, 0, buf.cols, false);
        if(saveMode==2)
          lastlinehtml = '<span class="BBSLine">'+this.listener.view.BBSROW[buf.rows-3].innerHTML+'</span>';
        if(downloaded != lastline) {
            var lastlastline = this.ansi.getText(buf.rows-4, 0, buf.cols, false);
            if(downloaded == lastlastline)
            {
              if(saveMode==2)
                this.article.push(lastlinehtml);
              else
                this.article.push(lastline);
            }
        }
        if(saveMode==2)
          this.article.push(html);
        else
          this.article.push(text);
        this.isLineFeed = false;
        return true;
    },

    // Modified from pcmanx-gtk2
    checkFinish: function(saveMode) {
        var buf = this.listener.buf;
        var text = buf.getRowText(buf.rows-1, 0, buf.cols);
        if(this.finishTest.test(text))
        {
          if(text.indexOf("100%") < 0)
            return false;
        }

        var text2;
        if(saveMode == 2)
          text2 = '<span class="BBSLine">'+this.listener.view.BBSROW[this.listener.buf.rows-1].innerHTML+'</span>';
        else
          text2 = this.ansi.getText(this.listener.buf.rows-1, 0, this.listener.buf.cols, false);
        this.article.push(text2);
        this.listener.view.doBlink = true;

        var data = this.article.join('\r\n');
        this.stopDownload(true);

        if(saveMode==0) {
            data = data.replace(/\x1b\[[0-9;]*m/g, '');
            if(this.listener.prefs.TrimTail)
                data = data.replace(/ +\r\n/g, '\r\n');
            if(this.listener.os != 'WINNT') // handle CRLF
                data = data.replace(/\r\n/g, '\n');
        }
        if(saveMode==2)
        {
          data = this.getHtmlHeader() + data + this.getHtmlTail();
        }
        this.callback(data);

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
      if(this.prefs.easyReadingWithImg || this.prefs.easyReadingWithVideo || this.prefs.preventNewTongWenAutoConv)
      {
        selstr += '<script type="text/javascript">function loadpage(){';
        if(this.prefs.preventNewTongWenAutoConv)
          selstr +='var tongwen=document.getElementById("tongwen_font");if(tongwen!=null)tongwen.parentNode.removeChild(tongwen);';
        if(this.prefs.easyReadingWithImg || this.prefs.easyReadingWithVideo)
          selstr += 'var allLinks=document.getElementsByTagName("a");';
        if(this.prefs.easyReadingWithVideo)
          selstr += 'var youtubeRegEx1 = new RegExp("(https?:\\\\/\\\\/www\\\\.youtube\\\\.com\\\\/watch\\\\?.*(v=[A-Za-z0-9._%-]*))","i");var youtubeRegEx2 = new RegExp("(https?:\\\\/\\\\/youtu\\\\.be\\\\/([A-Za-z0-9._%-]*))","i");var youtubeRegEx3 = new RegExp("(https?:\\\\/\\\\/m\\\\.youtube\\\\.com\\\\/watch\\\\?.*(v=[A-Za-z0-9._%-]*))","i");';
        if(this.prefs.easyReadingWithImg || this.prefs.easyReadingWithVideo)
          selstr += 'for(var i=0;i<allLinks.length;i++){var url = allLinks[i].getAttribute("href");var hrel = allLinks[i].getAttribute("rel");if(hrel){';
        if(this.prefs.easyReadingWithImg)
          selstr +='if(hrel.toLowerCase()=="p" && url.toLowerCase().indexOf("http://photo.xuite.net/")<0 && url.toLowerCase().indexOf("http://simplest-image-hosting.net/")<0 && url.toLowerCase().indexOf("http://screensnapr.com/")<0){var parentDiv = allLinks[i].parentNode;while(parentDiv.className!="BBSLine")parentDiv=parentDiv.parentNode;createImageTag(parentDiv.parentNode, parentDiv, url);};';
        if(this.prefs.easyReadingWithVideo)
          selstr +='if(youtubeRegEx1.test(url)){var splits = url.split(youtubeRegEx1);for(var j = 0; j < splits.length; ++j){if(splits[j].length>2){if(splits[j].substr(0,2)=="v="){url = splits[j].substring(2, splits[j].length);var parentDiv = allLinks[i].parentNode;while(parentDiv.className!="BBSLine")parentDiv=parentDiv.parentNode;createVideoTag(parentDiv.parentNode, parentDiv, url);break;}}}}else if(youtubeRegEx2.test(url)){url=url.substring(16, url.length);url=url.replace(/\\//, "");var parentDiv = allLinks[i].parentNode;while(parentDiv.className!="BBSLine")parentDiv=parentDiv.parentNode;createVideoTag(parentDiv.parentNode, parentDiv, url);}else if(youtubeRegEx3.test(url)){var splits = url.split(youtubeRegEx3);for(var j = 0; j < splits.length; ++j){if(splits[j].length>2){if(splits[j].substr(0,2)=="v="){url = splits[j].substring(2, splits[j].length);var parentDiv = allLinks[i].parentNode;while(parentDiv.className!="BBSLine")parentDiv=parentDiv.parentNode;createVideoTag(parentDiv.parentNode, parentDiv, url);break;}}}}';
        if(this.prefs.easyReadingWithImg || this.prefs.easyReadingWithVideo)
          selstr +='}}';
        selstr +='}';
        if(this.prefs.easyReadingWithImg)
          selstr +='var switchSize = {view: this, handleEvent: function(e) {if(e.target.getAttribute("class")=="scale"){e.target.setAttribute("class", "max");}else{e.target.setAttribute("class", "scale");}}};function createImageTag(pn, srcdom, code){var node = srcdom.nextSibling;var div;if(node.className!="AddLine"){div = document.createElement("div");div.setAttribute("class","AddLine");pn.insertBefore(div, srcdom.nextSibling);}else{div = node;}var br = document.createElement("BR");div.appendChild(br);var img = document.createElement("img");div.appendChild(img);img.setAttribute("src", code);img.setAttribute("class", "scale");img.addEventListener("click", switchSize, false);}';
        if(this.prefs.easyReadingWithVideo)
          selstr +='function createVideoTag(pn, srcdom, code){var node = srcdom.nextSibling;var div;if(node.className!="AddLine"){div = document.createElement("div");div.setAttribute("class","AddLine");pn.insertBefore(div, srcdom.nextSibling);}else{div = node;}var br = document.createElement("BR");div.appendChild(br);var iframe = document.createElement("iframe");div.appendChild(iframe);iframe.setAttribute("class","youtube-player");iframe.setAttribute("type","text/html");iframe.setAttribute("frameborder",0);var scrstr = "http://www.youtube.com/embed/"+code+"?hl=zh_TW&fs=1&rel=0&loop=0&autoplay=0";iframe.setAttribute("width",352);iframe.setAttribute("height",288);iframe.setAttribute("src",scrstr);}';
         selstr +='</script>';
      }
      selstr += '</head><body';
      if(this.prefs.easyReadingWithImg || this.prefs.easyReadingWithVideo || this.prefs.preventNewTongWenAutoConv)
        selstr += ' onload="loadpage()"';
      selstr += '><div id="BBSWindow"><div id="main" class="main">';
      return selstr;
    },

    getHtmlTail: function() {
      return '</div></div>' + this.prefs.easyReadingWithImg ? '<div id="bbsfox_em" style="display:none"/>' : '' + '</body></html>';
    }
};
