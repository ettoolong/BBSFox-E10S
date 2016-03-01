// Terminal View

var uriColor='#FF6600'; // color used to draw URI underline

function setTimer(repeat, func, timelimit) {
    var timer = Components.classes["@mozilla.org/timer;1"]
                  .createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback(
        { notify: function(timer) { func(); } },
        timelimit,
        repeat  ? Components.interfaces.nsITimer.TYPE_REPEATING_SLACK
                : Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    return timer;
}

function TermView(colCount, rowCount) {

    this.buf=null;
    this.bbscore=null;

    // Cursor
    this.cursorX=0;
    this.cursorY=0;

    //this.DBDetection = false;
    this.blinkShow = false;
    this.blinkOn = false;
    this.doBlink = true;

    this.selection = null;

    this.alertWin = null;
    this.enabledUpdate = true;
    this.input = document.getElementById('t');
    this.input.setAttribute('BBSFoxInput', '0');
    this.input.setAttribute('BBSInputText', '');
    //this.wordtest = document.getElementById('BBSFoxFontTest');
    this.symtable = window.symboltable;
    this.bbsCursor = document.getElementById('cursor');
    this.trackKeyWordList = document.getElementById('TrackKeyWordList');
    this.mainDisplay = document.getElementById('main');
    this.cursorDiv = document.getElementById('cursorDiv');
    this.BBSWin = document.getElementById('BBSWindow');

    this.pictureWindow = document.getElementById('PictureWindow');
    this.picturePreview = document.getElementById('PicturePreview');
    this.picturePreviewLoading = document.getElementById('PicturePreviewLoading');
    this.pictureInfoLabel = document.getElementById('PicturePreviewInfo');
    this.picLoadingImage = document.getElementById('PicLoadingImage');
    this.tempIamgeWidth=40;
    this.tempIamgeHeight=40;
    this.tempPicX=0;;
    this.tempPicY=0;
    this.hoverUrl = false;
    this.tempUrl = '';
    this.scaleX=1;
    this.scaleY=1;
    this.colorTable = 0;
    this.compositionStart = false;
    this.dp = new DOMParser();

    this.os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
    var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    this.FXVersion = parseFloat(appInfo.version);

    this.BBSROW = new Array(rowCount);
    for(var i=0;i<rowCount;++i) {
      this.BBSROW[i] = document.createElement('span');
      this.BBSROW[i].setAttribute('class','BBSLine');
      this.BBSROW[i].setAttribute('id','row_'+i);
      this.mainDisplay.appendChild(this.BBSROW[i]);
      //this.BBSROW[i]=document.getElementById("row_"+i);
    }
    this.firstGrid = document.getElementById('row_0');
    //this.findBar = null; //TODO: re-impl by termbuf

    this.input.addEventListener('compositionstart', this.composition_start.bind(this), false);
    this.input.addEventListener('compositionend', this.composition_end.bind(this), false);
    window.addEventListener('keypress', this.key_press.bind(this), false);
    this.input.addEventListener("input", this.text_input.bind(this), true);

    this.anchorClickHandler = {
        view: this,
        handleEvent: function(e) {
          this.view.bbscore.bgtab(e);
        }
    };

    //init view - start
    var tmp = [];
    tmp[0] = '<spen class="s">';
    for(var col=1; col<=colCount; ++col) {
      tmp[col] = '<span style="color:#FFFFFF;background-color:#000000;">\u0020</span>';
    }
    tmp[colCount+1] = '<br></spen>';
    for (var row=0 ;row<rowCount ;++row)
    {
      var doc = this.dp.parseFromString(tmp.join(''), "text/html");
      var n = this.BBSROW[row];
      if(n.firstChild)
        n.replaceChild(doc.body.firstChild, n.firstChild);
      else
        n.appendChild(doc.body.firstChild);
    }
    //init view - end

    var _this=this;
    this.blinkTimeout = setTimer(true, function(){_this.onBlink();}, 1000); //500

    this.highlightTimeout = null;
    this.highlighter = new Highlighter(this);
}


TermView.prototype={
    timerTrackKeyWord: null,
    termColors: [
      // dark
      '#000000', // black
      '#800000', // red
      '#008000', // green
      '#808000', // yellow
      '#000080', // blue
      '#800080', // magenta
      '#008080', // cyan
      '#c0c0c0', // light gray
      // bright
      '#808080', // gray
      '#ff0000', // red
      '#00ff00', // green
      '#ffff00', // yellow
      '#0000ff', // blue
      '#ff00ff', // magenta
      '#00ffff', // cyan
      '#ffffff'  // white
    ],
    onBlink: function(){
      this.blinkOn=true;
      this.buf.queueUpdate(true);
    },

    showAlertMessageEx: function(blockByTime, showMsg, playSound, msg){
      try{
        if(this.alertWin)
          this.alertWin.alert(blockByTime, showMsg, playSound, msg);
      }catch(e){}
    },

    //setBuf: function(buf) {
    //    this.buf=buf;
    //},

    //setConn: function(conn) {
    //    this.conn=conn;
    //},

    setCore: function(core, buf, conn) {
        this.bbscore = core;
        this.conn = conn;
        this.buf = buf;
        this.prefs = core.prefs;
        /*
        //TODO: re-impl by termbuf
        var rw = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
        var browserIndex = rw.gBrowser.getBrowserIndexForDocument(document);

        if (browserIndex > -1) {
          if(rw.gFindBar && rw.gFindBar._highlightDoc)
            this.findBar = rw.gFindBar;
          else
            this.findBar = null;
        }
        */
        this.alertWin = new AlertService(core, this, buf, conn);
    },

    setCol: function(colCount) {
      var cols = this.buf.cols;
      if(colCount > cols) {

      } else if(colCount < cols){

      }
      /*
      var tmp = [];
      tmp[0] = '<spen class="s">';
      for(var col=1; col<=colCount; ++col)
        tmp[col] = '<span style="color:#FFFFFF;background-color:#000000;">&nbsp;</span>';
      tmp[colCount+1] = '</spen>';
      for (var row=0 ;row<rowCount ;++row)
      {
        var doc = this.dp.parseFromString(tmp.join(''), "text/html");
        var n = this.BBSROW[row];
        if(n.firstChild)
          n.replaceChild(doc.body.firstChild, n.firstChild);
        else
          n.appendChild(doc.body.firstChild);
      }
      */
    },

    setRow: function(rowCount) {
      var rows = this.buf.rows;
      var cols = this.buf.cols;
      if(rowCount > rows) {
        var newLineCount = rowCount - rows;
        for(var j=0;j<newLineCount;++j) {
          var newEle = document.createElement('span');
          newEle.setAttribute('class','BBSLine');
          newEle.setAttribute('id','row_'+(rows+j));
          newEle.style.width = this.BBSROW[0].style.width;
          newEle.style.display = this.BBSROW[0].style.display;
          this.BBSROW.push(newEle); // rowCount+j
          this.mainDisplay.appendChild(newEle);
          //
          var tmp = [];
          tmp[0] = '<spen class="s">';
          for(var col=1; col<=cols; ++col)
            tmp[col] = '<span style="color:#FFFFFF;background-color:#000000;">\u0020</span>';
          tmp[cols+1] = '</spen>';
          var doc = this.dp.parseFromString(tmp.join(''), "text/html");
          if(newEle.firstChild)
            newEle.replaceChild(doc.body.firstChild, newEle.firstChild);
          else
            newEle.appendChild(doc.body.firstChild);
          //
        }
      } else if(rowCount < rows){
        var delLineCount = rows - rowCount;
        for(var j=rows-1;j>=rowCount;--j) {
          this.mainDisplay.removeChild(this.BBSROW[j]);
        }
        this.BBSROW.splice(rowCount);
      }
    },

    stopUpdate: function() {
      this.enabledUpdate = false;
    },

    startUpdate: function() {
      this.enabledUpdate = true;
    },

    update: function(force) {
      if(this.enabledUpdate)
        this.redraw(force);
    },

    prePicRel: function (str){
      if(str.search(this.buf.pictureRegEx) == -1)
        return ' rel="w"';
      else
        return ' rel="p"';
    },

    getFixStr: function (charCode){
      if(this.prefs.fixUnicodeDisplay && ((charCode>=0x2581 && charCode<=0x258f) || (charCode>=0x25e2 && charCode<=0x25e5)))
      {
        if(charCode==0x2584)
          return ' i="h"';
        else if(charCode>=0x2581 && charCode<=0x258f)
          return ' i="d"';
        else
        {
          var fixcode = charCode - 0x25e0;
          return ' i="'+fixcode+'"';
        }
      }
      else
        return '';
    },

    createTwoColorWord: function (ch, ch2, char1, char2, fg, fg2, bg, bg2, panding){
      var sp = panding==0?'':' style="display:inline-block;width:'+panding+'px;"';
      if(fg != fg2 && bg != bg2)
      {
        var s0 = '';
        sp += this.getFixStr(char1.charCodeAt(0));

        if(!ch.isBlink() && !ch2.isBlink())
        {
        }
        else if(ch.isBlink() && ch2.isBlink())
        {
          s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'b'+bg2+'" h="qq b'+bg+'b'+bg2+'"></x>';
        }
        else if(ch.isBlink() && !ch2.isBlink())
        {
          if(fg!=bg)
            s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'b'+bg2+'" h="w'+bg+' q'+fg2+' o b'+bg+'b'+bg2+'"></x>';
        }
        else// if(!ch.isBlink() && ch2.isBlink())
        {
          if(fg2!=bg2)
            s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'b'+bg2+'" h="w'+fg+' q'+bg2+' o b'+bg+'b'+bg2+'"></x>';
        }
        var s1 = '<span class="w' +fg+' q'+fg2+' o b'+bg+'b'+bg2+'" t="'+char1+'"' + sp + '>' + s0 + char1 + '</span>';
        return {s1: s1, s2: ''};
      }
      else if(fg != fg2 && bg == bg2)
      {
        var s0 = '';
        sp += this.getFixStr(char1.charCodeAt(0));
        if(!ch.isBlink() && !ch2.isBlink())
        {
        }
        else if(ch.isBlink() && ch2.isBlink())
        {
          s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'" h="qq'+bg+'"></x>';
        }
        else if(ch.isBlink() && !ch2.isBlink())
        {
          if(fg!=bg)
            s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'" h="w'+bg+' q'+fg2+' o b'+bg+'"></x>';
        }
        else// if(!ch.isBlink() && ch2.isBlink())
        {
          if(fg2!=bg2)
            s0 = '<x s="w'+fg+' q'+fg2+' o b'+bg+'" h="w'+fg+' q'+bg+' o b'+bg+'"></x>';
        }
        var s1 = '<span class="w' +fg+' q'+fg2+' o b'+bg+'" t="'+char1+'"' + sp +'>'+ s0 + char1 + '</span>';
        return {s1: s1, s2: ''};
      }
      else if(fg == fg2 && bg != bg2)
      {
        var s0 = '';
        sp += this.getFixStr(char1.charCodeAt(0));
        if(!ch.isBlink() && !ch2.isBlink())
        {
        }
        else if(ch.isBlink() && ch2.isBlink())
        {
          s0 = '<x s="q'+fg+' b'+bg+'b'+bg2+'" h="qq b'+bg+'b'+bg2+'"></x>';
        }
        else if(ch.isBlink() && !ch2.isBlink())
        {
          if(fg!=bg)
            s0 = '<x s="q'+fg+' b'+bg+'b'+bg2+'" h="w'+bg+' q'+fg+' o b'+bg+'b'+bg2+'"></x>';
        }
        else// if(!ch.isBlink() && ch2.isBlink())
        {
          if(fg2!=bg2)
            s0 = '<x s="q'+fg+' b'+bg+'b'+bg2+'" h="w'+fg+' q'+bg2+' o b'+bg+'b'+bg2+'"></x>';
        }
        var s1 = '<span class="q' +fg+' b'+bg+'b'+bg2+'" t="'+char1+'"' + sp +'>' + s0 + char1 + '</span>';
        return {s1: s1, s2: ''};
      }
      else if(fg == fg2 && bg == bg2)
      {
        var s0 = '';
        sp += this.getFixStr(char1.charCodeAt(0));
        if(ch.isBlink() && !ch2.isBlink())
        {
          if(bg != fg)
            s0 = '<x s="q'+fg+' b'+bg+'" h="w'+bg+' q'+fg+' o b'+bg+'"></x>';
        }
        else// if(!ch.isBlink() && ch2.isBlink())
        {
          if(bg2 != fg2)
            s0 = '<x s="q'+fg+' b'+bg+'" h="w'+fg+' q'+bg+' o b'+bg+'"></x>';
        }
        var s1 = '<span class="q'+fg+' b'+bg+'" t="'+char1+'"' + sp +'>' + s0 + char1 + '</span>';
        return {s1: s1, s2: ''};
      }
    },

    createNormalWord: function (ch, ch2, char1, char2, fg, bg, panding, deffg, defbg){
      //var s1 = '<span class="q' +fg+ 'b' +bg+ (ch.isBlink()?"k":"") +'" ';
      var fixStr = this.getFixStr(char1.charCodeAt(0));
      if(fixStr != '')
      {
        var s1 = '<span class="q' +fg+ ' b' +bg+'"';
        s1 += fixStr;
        s1 += ((panding==0?'':' style="display:inline-block;width:'+panding+'px;"') +'>' + (ch.isBlink()?'<x s="q'+fg+' b'+bg+'" h="qq'+bg+'"></x>':'') + char1 + '</span>');
        return {s1: s1, s2: ''};
      }
      else
      {
        if(fg == deffg && bg==defbg && !ch.isBlink())
        {
          if(panding==0)
            return {s1: char1, s2: char2};
          else
          {
            var s1 = '<span style="display:inline-block;width:'+panding+'px;">' + char1 + '</span>';
            return {s1: s1, s2: ''};
          }
        }
        else
        {
            var s1 = '<span class="q' +fg+ ' b' +bg+'"';
            s1 += ((panding==0?'':' style="display:inline-block;width:'+panding+'px;"') +'>' + (ch.isBlink()?'<x s="q'+fg+' b'+bg+'" h="qq'+bg+'"></x>':'') + char1 + '</span>');
            return {s1: s1, s2: ''};
        }
      }
    },

    createNormalChar: function (ch, char1, fg, bg, deffg, defbg){
      var useHyperLink = this.prefs.useHyperLink;
      var s0 = '';
      var s1 = '';
      var s2 = '';
      if(ch.isStartOfURL() && useHyperLink) {
        var boardNameStr = (ch.getBoardName() == '') ? '' : ' boardName="'+ch.getBoardName()+'"';
        var aidcStr = (ch.getAidc() == '') ? '' : ' aidc="'+ch.getAidc()+'"';
        s0 = '<a class="y"'+aidcStr+boardNameStr+' href="' +ch.getFullURL() + '"' + this.prePicRel( ch.getFullURL()) + ' target="_blank"><span link="true" class="q'+deffg+' b'+defbg+'">';
      }
      if(ch.isEndOfURL() && useHyperLink)
        s2 = '</span></a>';

      if(bg==defbg && (fg == deffg || char1 <= ' ') && !ch.isBlink() )
      {
        if(char1 <= ' ') // only display visible chars to speed up
          return s0+'\u0020'+s2;//return ' ';
        else if(char1 == '\x80') // 128, display ' ' or '?'
          return s0+'\u0020'+s2;
        else if(char1 == '\x3c')
          return s0+'&lt;'+s2;
        else if(char1 == '\x3e')
          return s0+'&gt;'+s2;
        else if(char1 == '\x26')
          return s0+'&amp;'+s2;
        else
          return s0+char1+s2;
      }
      else
      {
        s1 +='<span '+ (ch.isPartOfURL()?'link="true" ':'') +'class="q' +fg+ ' b' +bg+ '">'+ (ch.isBlink()?'<x s="q'+fg+' b'+bg+'" h="qq'+bg+'"></x>':'');
        if(char1 <= ' ') // only display visible chars to speed up
          s1 += '\u0020';
        else if(char1 == '\x80') // 128, display ' ' or '?'
          s1 += '\u0020';
        else
          s1 += char1;
        s1 += '</span>';
      }
      return s0+s1+s2;
    },

    redraw: function(force) {
        var cols=this.buf.cols;
        var rows=this.buf.rows;
        var useHyperLink = this.prefs.useHyperLink;
        //var ctx = this.ctx;
        var lineChangeds=this.buf.lineChangeds;

        var lines = this.buf.lines;
        var outhtmls = this.buf.outputhtmls;
        //var old_color = -1;
        var anylineUpdate = false;
        for(var row=0; row<rows; ++row) {
            var chh = this.chh;
            var deffg = 7;
            var defbg = 0;
            //var y=row * chh;
            //var x = 0;
            var line = lines[row];
            var outhtml = outhtmls[row];
            var lineChanged = lineChangeds[row];
            if(lineChanged==false && !force)
              continue;
            var lineUpdated = false;
            var chw = this.chw;
            var doHighLight = (this.prefs.highlightCursor && this.buf.nowHighlight!=-1 && this.buf.nowHighlight==row);

            for(var col=0; col<cols; ++col) {
                var ch = line[col];
                var outtemp = outhtml[col];
                if(force || ch.needUpdate) {
                    lineUpdated = true;
                    var fg = ch.getFg();
                    var bg = ch.getBg();
                    if(doHighLight)
                    {
                      deffg = 7;
                      defbg = this.prefs.highlightBG;
                      bg = this.prefs.highlightBG;
                      //fg = 0;
                    }
                    outtemp.setHtml('');
                    if(ch.isLeadByte) { // first byte of DBCS char
                        ++col;
                        if(col < cols) {
                            var ch2 = line[col]; // second byte of DBCS char
                            var outtemp2 = outhtml[col];

                            var bg2 = ch2.getBg();
                            var fg2 = ch2.getFg();
                            if(doHighLight)
                            {
                              bg2 = this.prefs.highlightBG;
                              //fg2 = 0;
                            }
                            if(bg!=bg2 || fg!=fg2 || ch.isBlink()!=ch2.isBlink() )
                            {
                              if(ch2.ch=='\x20') //a LeadByte + ' ' //we set this in '?' + ' '
                              {
                                var spanstr = this.createNormalChar(ch, '?', fg, bg, deffg, defbg);
                                outtemp.setHtml(spanstr);
                                spanstr = this.createNormalChar(ch, ' ', fg2, bg2, deffg, defbg);
                                outtemp2.setHtml(spanstr);
                              }
                              else //maybe normal ...
                              {
                                var b5=ch.ch + ch2.ch; // convert char to UTF-8 before drawing
                                var u='';
                                if(this.prefs.charset == 'UTF-8' || b5.length == 1)
                                  u = b5;
                                else
                                  u = uaoConv.b2u(b5, this.prefs.charset);

                                if(u) // can be converted to valid UTF-8
                                {
                                  if(u.length==1) //normal chinese word
                                  {
                                    var code = this.symtable['x'+u.charCodeAt(0).toString(16)];
                                    if(code == 1 || code == 2)
                                    {
                                      var spanstr = this.createTwoColorWord(ch, ch2, u, u, fg, fg2, bg, bg2, this.chh);
                                      outtemp.setHtml(spanstr.s1);
                                      outtemp2.setHtml(spanstr.s2);
                                    }
                                    else if(code == 3) //[4 code char]
                                    {
                                      var spanstr = this.createNormalChar(ch, '?', fg2, bg2, deffg, defbg);
                                      outtemp.setHtml(spanstr);
                                      spanstr = this.createNormalChar(ch2, '?', fg2, bg2, deffg, defbg);
                                      outtemp2.setHtml(spanstr);
                                    }
                                    else //if(this.wordtest.offsetWidth==this.chh)
                                    {
                                      var spanstr = this.createTwoColorWord(ch, ch2, u, u, fg, fg2, bg, bg2, 0);
                                      outtemp.setHtml(spanstr.s1);
                                      outtemp2.setHtml(spanstr.s2);
                                    }
                                  }
                                  else //a <?> + one normal char // we set this in '?' + ch2
                                  {
                                    var spanstr = this.createNormalChar(ch, '?', fg, bg, deffg, defbg);
                                    outtemp.setHtml(spanstr);
                                    spanstr = this.createNormalChar(ch, ch2.ch, fg2, bg2, deffg, defbg);
                                    outtemp2.setHtml(spanstr);
                                  }
                                }
                              }
                            }
                            else
                            {
                              if(ch2.ch=='\x20') //a LeadByte + ' ' //we set this in '?' + ' '
                              {
                                var spanstr = this.createNormalChar(ch, '?', fg, bg, deffg, defbg);
                                outtemp.setHtml(spanstr);
                                spanstr = this.createNormalChar(ch, ' ', fg, bg, deffg, defbg);
                                outtemp2.setHtml(spanstr);
                              }
                              else //maybe normal ...
                              {
                                var b5=ch.ch + ch2.ch; // convert char to UTF-8 before drawing
                                var u = '';
                                if(this.prefs.charset == 'UTF-8' || b5.length == 1)
                                  u = b5;
                                else
                                  u = uaoConv.b2u(b5, this.prefs.charset);

                                if(u) { // can be converted to valid UTF-8
                                  if(u.length==1) //normal chinese word
                                  {
                                    var code = this.symtable['x'+u.charCodeAt(0).toString(16)];
                                    if(code == 1 || code == 2)
                                    {
                                      var spanstr = this.createNormalWord(ch, ch2, u, '', fg, bg, this.chh, deffg, defbg);
                                      outtemp.setHtml(spanstr.s1);
                                      outtemp2.setHtml(spanstr.s2);
                                    }
                                    else if(code == 3) //[4 code char]
                                    {
                                      var spanstr = this.createNormalChar(ch, '?', fg, bg, deffg, defbg);
                                      outtemp.setHtml(spanstr);
                                      spanstr = this.createNormalChar(ch2, '?', fg, bg, deffg, defbg);
                                      outtemp2.setHtml(spanstr);
                                    }
                                    else //normal case //if(this.wordtest.offsetWidth==this.chh)
                                    {
                                      //for font test - start
                                      /*
                                      if(fg==bg && fg==2)
                                        alert(fg+'!!!!! : '+ u.charCodeAt(0).toString(16)); //for debug.
                                      this.wordtest.innerHTML = u; // it's too slow Orz
                                      if(this.wordtest.offsetWidth==this.chw)
                                        alert('1 : '+ u.charCodeAt(0).toString(16)); //for debug.
                                      else if(this.wordtest.offsetWidth!=this.chh)
                                        alert('!!!!! : '+ u.charCodeAt(0).toString(16)); //for debug.
                                      */
                                      //for font test - end
                                      var spanstr = this.createNormalWord(ch, ch2, u, '', fg, bg, 0, deffg, defbg);
                                      outtemp.setHtml(spanstr.s1);
                                      outtemp2.setHtml(spanstr.s2);
                                    }
                                  }
                                  else //a <?> + one normal char // we set this in '?' + ch2
                                  {
                                    var spanstr = this.createNormalChar(ch, '?', fg, bg, deffg, defbg);
                                    outtemp.setHtml(spanstr);
                                    spanstr = this.createNormalChar(ch, ch2.ch, fg, bg, deffg, defbg);
                                    outtemp2.setHtml(spanstr);
                                  }
                                }
                              }
                            }
                            // draw background color
                            //if(bg != old_color) {
                            //    old_color=bg;
                            //}
                            //if(bg = bg2) { // two bytes has the same bg
                            //}
                            //else { // two bytes has different bg
                            //    old_color=bg2;
                            //}
                            //x += chw;
                            line[col].needUpdate=false;
                        }
                    }
                    else //NOT LeadByte
                    {
                        var spanstr = this.createNormalChar(ch, ch.ch, fg, bg, deffg, defbg);
                        outtemp.setHtml(spanstr);
                        //if(bg != old_color) {
                        //    old_color=bg;
                        //}
                    }
                    ch.needUpdate=false;
                }
                //x += chw;
            }
            // draw underline for links

            if(lineUpdated){
              lineUpdated = false;
              var tmp = [];
              var shouldFade = false;
              var userid = '';

              // check blacklist for user and fade row
              if (this.prefs.enableBlacklist && this.prefs.blacklistedUserIds.length) {
                var rowText = this.buf.getRowText(row, 0, this.buf.cols);
                if (this.buf.PageState == 3 && this.bbscore.isPTT()) {
                  userid = parsePushthreadForUserId(rowText);
                } else if (this.buf.PageState == 2) {
                  userid = parseThreadForUserId(rowText);
                }
                if (this.prefs.blacklistedUserIds.indexOf(userid)!=-1) {
                  shouldFade = true;
                }
              }

              //
              if(doHighLight)
                tmp.push('<span hl="1" class="q'+deffg+' b'+defbg+'">');
              else
                tmp.push('<span class="s">');

              //for (var j=0 ;j<cols ;++j)
              //  tmp[j] = outhtml[j].getHtml();
              for (var j=0 ;j<cols ;++j)
                tmp.push(outhtml[j].getHtml());

              //if(doHighLight)
                tmp.push('<br></span>');

              //var doc = this.dp.parseFromString(tmp.join(''), "text/xml"); //parsing fail when string include '&nbsp;'
              var doc = this.dp.parseFromString(tmp.join(''), "text/html");
              //
              if(this.prefs.loadURLInBG){
                var allLinks = doc.getElementsByTagName('a');
                for(var k=0;k<allLinks.length;++k) {
                  if(!allLinks[k].getAttribute('aidc')) {
                    allLinks[k].addEventListener('click', this.anchorClickHandler, true);
                  }
                }
              }
              //
              var n = this.BBSROW[row];
              if(n.firstChild)
                n.replaceChild(doc.body.firstChild, n.firstChild);
              else
                n.appendChild(doc.body.firstChild);
              if(shouldFade)
                n.firstChild.classList.add('bluFade');

              /*
              if(n.firstChild)
                n.replaceChild(doc.documentElement, n.firstChild);
              else
                n.appendChild(doc.documentElement);
              */
              //this.BBSROW[row].innerHTML = tmp.join('');
              if(row==this.buf.tempMouseRow)
              {
                /*
                var isOnLink = false;
                var uris = this.buf.lines[row].uris;
                if (uris) {
                  for (var urridx=0;i<uris.length;i++) {
                    if (this.buf.tempMouseCol >= uris[urridx][0] && this.buf.tempMouseCol < uris[urridx][1]) {
                      isOnLink = true;
                      break;
                    }
                  }
                }
                if(!isOnLink)
                */
                this.bbscore.resetStatusBar();
              }
              //highlight words
              anylineUpdate = true;
              lineChangeds[row] = false;
            }
        }
        if(anylineUpdate) {
          var allLinks = document.getElementsByTagName('a');
          var haveLink = (allLinks.length > 0);
          this.prefs.updateOverlayPrefs([{key:'haveLink', value:haveLink}]);
        }

        if(anylineUpdate && this.prefs.enableHighlightWords && this.prefs.highlightWords.length>0)
        {
          if(this.timerTrackKeyWord)
            this.timerTrackKeyWord.cancel();
          this.timerTrackKeyWord = setTimer(false, function(){
            var highlightWords = this.prefs.highlightWords;
            var highlightWords_local = this.prefs.highlightWords_local;
            for(var i=0;i<highlightWords.length;++i){
              this.highlighter.highlight(highlightWords[i], this.prefs.keyWordTrackCaseSensitive);
            }
            for(var i=0;i<highlightWords_local.length;++i){
              this.highlighter.highlight(highlightWords_local[i], this.prefs.keyWordTrackCaseSensitive);
            }
          }.bind(this), 1);
        }
    },

    text_input: function(event) {
      if(!this.bbscore.keyEventStatus)
        return;
      if(!this.compositionStart) {
        event.stopPropagation();
        event.preventDefault();
        var text = event.target.value;
        if(text) {
          this.conn.convSend(text, this.prefs.charset);
        }
        event.target.value='';
      }
    },

    key_press: function(e) {
        if(!this.bbscore.keyEventStatus)
          return;
        if(this.bbscore.DelayPasteBuffer != '' || this.bbscore.DelayPasteIndex != -1)
        {
          this.bbscore.DelayPasteBuffer = '';
          this.bbscore.DelayPasteIndex = -1;
          this.showAlertMessageEx(false, true, false, this.bbscore.getLM('delayPasteStop'));
          return;
        }
        // dump('onKeyPress:'+e.charCode + ', '+e.keyCode+'\n');
        var conn = this.conn;
        if(e.charCode){
            // Control characters
            if(this.os=='Darwin')
            {
              if(e.metaKey && !e.altKey && !e.shiftKey && (e.charCode == 61 || e.charCode == 45)) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
            }
            else
            {
              if(e.ctrlKey && !e.altKey && !e.shiftKey && (e.charCode == 61 || e.charCode == 45)) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
            }

            if(e.ctrlKey && !e.altKey && !e.shiftKey) {
                // Ctrl + @, NUL, is not handled here
                if( this.prefs.hotkeyCtrlW == 0 && (e.charCode == 87 || e.charCode == 119) ) {
                    return;
                }
                else if( this.prefs.hotkeyCtrlB == 0 && (e.charCode == 66 || e.charCode == 98) ) {
                    return;
                }
                else if( this.prefs.hotkeyCtrlL == 0 && (e.charCode == 76 || e.charCode == 108) ) {
                    return;
                }
                else if( this.prefs.hotkeyCtrlT == 0 && (e.charCode == 84 || e.charCode == 116) ) {
                    return;
                }
                else if( e.charCode >= 65 && e.charCode <=90 ) { // A-Z
                    conn.send( String.fromCharCode(e.charCode - 64) );
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                else if( e.charCode >= 97 && e.charCode <=122 ) { // a-z
                    conn.send( String.fromCharCode(e.charCode - 96) );
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
        }
        else if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch(e.keyCode){
            case 8:
                if(this.checkLeftDB())
                  conn.send('\b\b');
                else
                  conn.send('\b');
                break;
            case 9:
                conn.send('\t');
                // don't move input focus to next control
                e.preventDefault();
                e.stopPropagation();
                break;
            case 13:
                conn.send('\r');
                break;
            case 27: //ESC
                conn.send('\x1b');
                break;
            //case 33: //Page Up
            //    conn.send('\x1b[5~');
            //    break;
            //case 34: //Page Down
            //    conn.send('\x1b[6~');
            //    break;
            case 35: //End
                conn.send('\x1b[4~');
                break;
            case 36: //Home
                conn.send('\x1b[1~');
                break;
            case 37: //Arrow Left
                if(this.checkLeftDB())
                  conn.send('\x1b[D\x1b[D');
                else
                  conn.send('\x1b[D');
                break;
            //case 38: //Arrow Up
            //    conn.send('\x1b[A');
            //    break;
            case 39: //Arrow Right
                if(this.checkCurDB())
                  conn.send('\x1b[C\x1b[C');
                else
                  conn.send('\x1b[C');
                break;
            //case 40: //Arrow Down
            //    conn.send('\x1b[B');
            //    break;
            case 45: //Insert
                conn.send('\x1b[2~');
                break;
            case 46: //DEL
                if(this.checkCurDB())
                  conn.send('\x1b[3~\x1b[3~');
                else
                  conn.send('\x1b[3~');
                break;
            case 112: //F1
                conn.send('\x1bOP');
                break;
            case 113: //F2
                conn.send('\x1bOQ');
                break;
            case 114: //F3
                conn.send('\x1bOR');
                break;
            case 115: //F4
                conn.send('\x1bOS');
                break;
            case 116: //F5
                conn.send('\x1b[15~');
                break;
            case 117: //F6
                conn.send('\x1b[17~');
                break;
            case 118: //F7
                conn.send('\x1b[18~');//Firefox [keyboard browsing] hotkey
                e.preventDefault();
                e.stopPropagation();
                break;
            case 119: //F8
                conn.send('\x1b[19~');
                break;
            case 120: //F9
                conn.send('\x1b[20~');
                break;
            case 121: //F10
                conn.send('\x1b[21~');
                break;
            case 122: //F11
                ;//conn.send('\x1b[23~');//Firefox [Full Screen] hotkey
                break;
            case 123: //F12
                conn.send('\x1b[24~');
                break;
            }
        }
    },

    setTermFontSize: function(cw, ch) {
      this.chw = cw;
      this.chh = ch;
      this.mainDisplay.style.fontSize = this.chh + 'px';
      this.mainDisplay.style.lineHeight = this.chh + 'px';
      this.mainDisplay.style.overflow = 'hidden';
      this.mainDisplay.style.textAlign = 'left';
      this.mainDisplay.style.width = this.chw*this.buf.cols + 'px';
      for(var i=0;i<this.buf.rows;++i)
        this.BBSROW[i].style.width=this.chw*this.buf.cols + 'px';

      if(this.prefs.verticalAlignCenter && this.chh*this.buf.rows < document.documentElement.clientHeight)
        this.mainDisplay.style.marginTop = ((document.documentElement.clientHeight-this.chh*this.buf.rows)/2) + 'px';
      else
        this.mainDisplay.style.marginTop = '0px';

      if(this.prefs.keepFontAspectRatio){
        this.scaleX = 1;
        this.scaleY = 1;
      }
      else{
        this.scaleX = Math.floor(document.documentElement.clientWidth / (this.chw*this.buf.cols) * 100)/100;
        this.scaleY = Math.floor(document.documentElement.clientHeight / (this.chh*this.buf.rows) * 100)/100;
      }

      if(this.scaleX==1 && this.scaleY==1){
        this.mainDisplay.style.transform = 'none';
      }
      else if(this.scaleX==1){
        this.mainDisplay.style.transform = 'scaleY('+this.scaleY+')';
      }
      else if(this.scaleY==1){
        this.mainDisplay.style.transform = 'scaleX('+this.scaleX+')';
      }
      else{
        this.mainDisplay.style.transform = 'scale('+this.scaleX+','+this.scaleY+')';
      }
      this.cursorDiv.style.fontSize = this.mainDisplay.style.fontSize;
      this.cursorDiv.style.lineHeight = this.mainDisplay.style.lineHeight;
      this.cursorDiv.style.overflow = 'visible';
      this.cursorDiv.style.textAlign = this.mainDisplay.style.textAlign;
      this.cursorDiv.style.width = this.mainDisplay.style.width;
      this.cursorDiv.style.height = '0px';
      if(this.scaleX==1 && this.scaleY==1){
        this.cursorDiv.style.top = '0px';
        this.cursorDiv.style.marginTop = '0px';
      } else {
        this.cursorDiv.style.top = this.mainDisplay.style.marginTop;
        this.cursorDiv.style.marginTop = '1px';
      }
      this.cursorDiv.style.transform = this.mainDisplay.style.transform;
      this.bbsCursor.style.width = this.chw + 'px';
      var curHeight = Math.floor(this.chh/6);
      if(curHeight<2) curHeight = 2;
      this.bbsCursor.style.height = curHeight + 'px';

      this.updateCursorPos();
    },

    convertMN2XY: function (cx, cy){
      var origin = [this.firstGrid.offsetLeft, 0];
      if(this.scaleX==1 && this.scaleY==1){
        origin[1] = this.firstGrid.offsetTop;
      }

      var realX = origin[0] + (cx * this.chw);
      var realY = origin[1] + (cy * this.chh);
      return [realX, realY];
    },

    convertMN2XYEx: function (cx, cy){
      var origin;
      if(this.prefs.horizontalAlignCenter && this.scaleX!=1)
        origin = [((document.documentElement.clientWidth - (this.chw*this.buf.cols)*this.scaleX)/2), this.firstGrid.offsetTop];
      else
        origin = [this.firstGrid.offsetLeft, this.firstGrid.offsetTop];
      var realX = origin[0] + (cx * this.chw) * this.scaleX;
      var realY = origin[1] + (cy * this.chh) + 1 + parseInt(this.mainDisplay.style.marginTop, 10);
      return [realX, realY];
    },

    checkLeftDB: function(){
      if(this.prefs.dbcsDetect && this.buf.cur_x>1){
        var lines = this.buf.lines;
        var line = lines[this.buf.cur_y];
        var ch = line[this.buf.cur_x-2];
        if(ch.isLeadByte)
          return true;
      }
      return false;
    },

    checkCurDB: function(){
      if(this.prefs.dbcsDetect){// && this.buf.cur_x<this.buf.cols-2){
        var lines = this.buf.lines;
        var line = lines[this.buf.cur_y];
        var ch = line[this.buf.cur_x];
        if(ch.isLeadByte)
          return true;
      }
      return false;
    },

    // Cursor
    updateCursorPos: function(){
      var pos = this.convertMN2XY(this.buf.cur_x, this.buf.cur_y);
      if(this.buf.cur_y>=this.buf.rows || this.buf.cur_x>=this.buf.cols)
        return; //sometimes, the value of this.buf.cur_x is 80 :(

      var lines = this.buf.lines;
      var line = lines[this.buf.cur_y];
      var ch = line[this.buf.cur_x];
      var bg = ch.getBg();

      this.bbsCursor.style.left = pos[0] + 'px';
      var h = this.chh - parseInt(this.bbsCursor.style.height);
      this.bbsCursor.style.top = pos[1] + h + 'px';

      // if you want to set cursor color by now background, use this.
      this.bbsCursor.setAttribute('cr', 'Iq'+bg);
      this.updateInputBufferPos();
    },

    updateInputBufferPos: function() {
      if(this.compositionStart)
      {
        var pos = this.convertMN2XYEx(this.buf.cur_x, this.buf.cur_y);
        if(!this.prefs.hideInputBuffer)
        {
          this.input.style.opacity = '1';
          this.input.style.border = 'double';
          if(this.prefs.inputBufferSizeType==0)
          {
            this.input.style.width  = (this.chh-4)*10 + 'px';
            this.input.style.fontSize = this.chh-4 + 'px';
            //this.input.style.lineHeight = this.chh+4 + 'px';
            this.input.style.height = this.chh + 'px';
          }
          else
          {
            this.input.style.width  = ((this.prefs.defineInputBufferSize*2)-4)*10 + 'px';
            this.input.style.fontSize = ((this.prefs.defineInputBufferSize*2)-4) + 'px';
            //this.input.style.lineHeight = this.bbscore.inputBufferSize*2+4 + 'px';
            this.input.style.height = this.prefs.defineInputBufferSize*2 + 'px';
          }
        }
        else
        {
          this.input.style.border = 'none';
          this.input.style.width  = '0px';
          this.input.style.height = '0px';
          this.input.style.fontSize = this.chh + 'px';
          this.input.style.opacity = '0';
          //this.input.style.left = '-100000px';
        }
        var bbswinheight = parseFloat(this.BBSWin.style.height);
        var bbswinwidth = parseFloat(this.BBSWin.style.width);
        if(bbswinheight < pos[1] + parseFloat(this.input.style.height) + this.chh)
          this.input.style.top = (pos[1] - parseFloat(this.input.style.height) - this.chh)+ 4 +'px';
        else
          this.input.style.top = (pos[1] + this.chh) +'px';

        if(bbswinwidth < pos[0] + parseFloat(this.input.style.width))
          this.input.style.left = bbswinwidth - parseFloat(this.input.style.width)- 10 +'px';
        else
          this.input.style.left = pos[0] +'px';

        //this.input.style.left = pos[0] +'px';
      }
      //fix input buffer pos - start
      //else
      //{
      //  var pos = this.convertMN2XY(this.buf.cur_x, this.buf.cur_y);
      //  this.input.style.top = (pos[1] + this.chh) +'px';
      //  this.input.style.left = pos[0] +'px';
      //}
      //fix input buffer pos - end
    },

    composition_start: function(e) {
      //this.input.disabled="";
      //this.input.setAttribute('bshow', '1');
      this.compositionStart = true;

      this.updateInputBufferPos();
    },

    composition_end: function(e) {
      //this.input.disabled="";
      //this.input.setAttribute('bshow', '0');
      this.compositionStart = false;
      this.input.style.border = 'none';
      this.input.style.width =  '0px';
      this.input.style.height = '0px';
      this.input.style.left =  '0px';
      this.input.style.top = '0px';
      this.input.style.opacity = '0';
      //this.input.style.top = '0px';
      //this.input.style.left = '-100000px';
    },

    fontResize: function(){
      var cols = this.buf ? this.buf.cols : 80;
      var rows = this.buf ? this.buf.rows : 24;

      this.BBSWin.style.height = document.documentElement.clientHeight +'px';
      this.BBSWin.style.width = document.documentElement.clientWidth +'px';
      this.bbscore.bbsbg.SetSize(this.BBSWin.style.width, this.BBSWin.style.height);

      if(this.prefs.screenType==0 || this.prefs.screenType==1)
      {
        var width = this.prefs.bbsWidth ? this.prefs.bbsWidth : document.documentElement.clientWidth;
        var height = this.prefs.bbsHeight ? this.prefs.bbsHeight : document.documentElement.clientHeight;
        if(width == 0 || height == 0) return; // errors for openning in a new window

        var o_h, o_w, i = 4;
        var nowchh = this.chh;
        var nowchw = this.chw;
        do{
          ++i;
          nowchh = i*2;
          nowchw = i;
          o_h = (nowchh) * rows;
          o_w = nowchw * cols;
        }while(o_h <= height && o_w <= width);
        --i;
        nowchh = i*2;
        nowchw = i;
        this.setTermFontSize(nowchw, nowchh);
      }
      else
      {
        this.setTermFontSize(this.prefs.bbsFontSize, this.prefs.bbsFontSize*2);
      }
    },

    countChar: function(nd)
    {
      var row = 0;
      var col = 0;
      if (nd.parentNode.className == 's' || nd.parentNode.getAttribute('hl')=='1')
      {
        row = parseInt(nd.parentNode.parentNode.id.substr(4) );
        tmp = nd.previousSibling;
      }
      else
      {
        tmp = nd.parentNode;
        if(tmp && tmp.parentNode && tmp.parentNode.className == 'y')
        {
          tmp = tmp.parentNode;
        }
        if(!tmp.previousSibling && tmp.parentNode && tmp.parentNode.parentNode && tmp.parentNode.parentNode.className=='y')
        {
          tmp = tmp.parentNode.parentNode;
        }
        if (tmp.parentNode && (tmp.parentNode.className == 's' || tmp.parentNode.getAttribute('hl')=='1') ) {
          row = parseInt(tmp.parentNode.parentNode.id.substr(4) );
        }
        tmp = tmp.previousSibling;
      }
      while(tmp)
      {
        var textContent = tmp.textContent;
        textContent = textContent.replace(/\u00a0/g, " ");
        col += uaoConv.u2b(textContent).length;
        if(tmp && tmp.parentNode && tmp.parentNode.className == 'y')
        {
          tmp = tmp.parentNode;
        }
        if(!tmp.previousSibling && tmp.parentNode && tmp.parentNode.parentNode && tmp.parentNode.parentNode.className=='y')
        {
          tmp = tmp.parentNode.parentNode;
        }
        if (tmp.parentNode && (tmp.parentNode.className == 's' || tmp.parentNode.getAttribute('hl')=='1') ) {
          row = parseInt(tmp.parentNode.parentNode.id.substr(4) );
        }
        tmp = tmp.previousSibling;
      }
      return {row:row, col:col};
    },

    getSelectionColRow: function(){
      var r = window.getSelection().getRangeAt(0);
      var tmpstr = r.toString();
      tmpstr = tmpstr.replace(/\r\n/g, '\r');
      tmpstr = tmpstr.replace(/\n/g, '\r');
      var b = r.startContainer;
      var e = r.endContainer;
      var selection = { start: { row: -1, col: -1 }, end: { row: -1, col: -1 } };
      var tmp;
      var cols = this.buf.cols;
      var rows = this.buf.rows;
      if(r.startContainer.className == 'main') //select all
      {
        selection.start.row = 0;
        selection.end.row = rows-1;
        selection.start.col = 0;
        selection.end.col = cols-1;
        return selection;
      }

      if (b.className == 's' || (b.nodeType==1 && b.getAttribute('hl')=='1')){
        if(tmpstr.substr(0,1) == '\r')
        {
          selection.start.row = parseInt(b.parentNode.id.substr(4))+1;
          selection.start.col = 0;
        }
        else
        {
          selection.start.row = parseInt(b.parentNode.id.substr(4))-1;
          selection.start.col = 0;
        }
      }

      if (e.className == 's' || (e.nodeType==1 && e.getAttribute('hl')=='1')){
        if(tmpstr.substr(tmpstr.length-1,1) == '\r')
        {
        }
        else
        {
          selection.end.row = parseInt(e.parentNode.id.substr(4));
          selection.end.col = cols-1;
        }
      }

      if(selection.start.row==-1 && selection.start.col==-1) {
        selection.start = this.countChar(b);
      }

      if(selection.end.row==-1 && selection.end.col==-1) {
        selection.end = this.countChar(e);
      }

      if (b.className == 's' || (b.nodeType==1 && b.getAttribute('hl')=='1')){
      }else{
        if (r.startOffset != 0) {
          var substr = b.substringData(0, r.startOffset);
          substr = substr.replace(/\u00a0/g, " ");
          selection.start.col += uaoConv.u2b(substr).length;
        }
      }

      if (e.className == 's' || (e.nodeType==1 && e.getAttribute('hl')=='1')){
      }else{
        if (r.endOffset != 1) {
          var substr = e.substringData(0, r.endOffset);
          substr = substr.replace(/\u00a0/g, " ");
          selection.end.col += uaoConv.u2b(substr).length - 1;
        }
      }

      if(selection.end.col == -1){
        selection.end.row = selection.end.row - 1;
        selection.end.col = cols-1;
      }
      return selection;
    },

    invertColor: function(hexTripletColor){
          var color = hexTripletColor;
          color = color.substring(1);           // remove #
          color = parseInt(color, 16);          // convert to integer
          color = 0xFFFFFF ^ color;             // invert three bytes
          color = color.toString(16);           // convert to hex
          color = ("000000" + color).slice(-6); // pad with leading zeros
          color = "#" + color;                  // prepend #
          return color;
    },

    getColorDefineCSS: function(index){
      var getColorValue = function(hexTripletColor) {
          return hexTripletColor;
      };
      var getInvertColorValue = function(hexTripletColor) {
          return hexTripletColor;
      };
      if(this.colorTable == 0)
        getInvertColorValue = this.invertColor;
      if(this.colorTable == 1)
        getColorValue = this.invertColor;

      var prefs = this.prefs;
      var cssDefine = 'body {';
      cssDefine+='--bbscolor-'+index+':'+ getColorValue(prefs.bbsColor[index]) +';';
      cssDefine+='--bbscolor-inv-'+index+':'+ getInvertColorValue(prefs.bbsColor[index]) +';';
      cssDefine+='}';
      return cssDefine;
    },

    setColorDefine: function(index){
      var setCSS = function(node, newcss){
        var tn = document.createTextNode(newcss);
        if(node.firstChild)
          node.replaceChild(tn ,node.firstChild);
        else
          node.appendChild(tn);
      };

      var getColorDefineElem = function(id) {
        var elem = document.getElementById(id);
        if(!elem) {
          var firstNode = document.getElementById('ColorDefine1');
          elem = document.createElement('style');
          elem.setAttribute('id', id);
          firstNode.parentNode.insertBefore(elem, firstNode);
        }
        return elem;
      };
      var colorDefine;
      if(typeof index !== 'undefined') {
        colorDefine = getColorDefineElem('ColorDefine' + (index+1));
        setCSS(colorDefine, this.getColorDefineCSS(index));
      } else {
        for(var i=0;i<16;++i) {
          colorDefine = getColorDefineElem('ColorDefine' + (i+1));
          setCSS(colorDefine, this.getColorDefineCSS(i));
        }
      }
    },

    changeColorTable: function(){
      if(this.colorTable == 0) {
        this.colorTable = 1;
      } else {
         this.colorTable = 0;
      }
      this.setColorDefine();
    },

    cancelHighlightTimeout: function() {
      if(this.highlightTimeout)
      {
        this.highlightTimeout.cancel();
        this.highlightTimeout=null;
      }
    },

    setHighlightTimeout: function(cb) {
      this.cancelHighlightTimeout();
      var _this=this;
      var func=function() {
        _this.highlightTimeout=null;
        cb();
      }
      if(this.prefs.mouseBrowsingHlTime)
        this.highlightTimeout = setTimer(false, func, this.prefs.mouseBrowsingHlTime);
    }
    /*
    myTimer: function(repeat, func_obj, timelimit) {
      var timer = Components.classes["@mozilla.org/timer;1"]
                      .createInstance(Components.interfaces.nsITimer);
      timer.initWithCallback(
         { notify: function(timer) { func_obj(); } },
         timelimit,
         repeat  ? Components.interfaces.nsITimer.TYPE_REPEATING_SLACK
                 : Components.interfaces.nsITimer.TYPE_ONE_SHOT);
      return timer;
    }
    */
};
