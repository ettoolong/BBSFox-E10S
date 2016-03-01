function EmbeddedPlayer(bbscore, playerURL, showbtn, playerSize) {
    this.CmdHandler = document.getElementById('cmdHandler');
    //this.opt = new Array(8);

    var BBSWin = document.getElementById('BBSWindow');
    var playerDiv = document.createElementNS(XUL_NS, 'div');
    BBSWin.appendChild(playerDiv);
    playerDiv.classList.add('extUI');
    playerDiv.classList.add('dragUI');
    playerDiv.classList.add('drag');
    playerDiv.classList.add('embedPlayer');
    playerDiv.style.left = '10px';
    playerDiv.style.top = '10px';
    playerDiv.addEventListener('mousedown', this.mousedown.bind(this), false);
    playerDiv.addEventListener('mouseup', this.mouseup.bind(this), false);

    var box1 = document.createElementNS(XUL_NS, 'vbox');
    playerDiv.appendChild(box1);

    var box2 = document.createElementNS(XUL_NS, 'hbox');
    box1.appendChild(box2);
    box2.classList.add('extUI');
    box2.classList.add('dragUI');
    box2.classList.add('nonspan');

    var spacer1 = document.createElementNS(XUL_NS, 'spacer');
    box2.appendChild(spacer1);
    spacer1.setAttribute('flex','1');
    spacer1.classList.add('extUI');
    spacer1.classList.add('dragUI');
    spacer1.classList.add('nonspan');

    var minBtn = document.createElementNS(XUL_NS, 'image');
    box2.appendChild(minBtn);
    minBtn.setAttribute('width','14px');
    minBtn.setAttribute('height','14px');
    minBtn.classList.add('extUI');
    minBtn.classList.add('buttonUI');
    minBtn.classList.add('minWindowBtn');
    minBtn.onclick = function(e){
      if(e.button==0)
        bbsfox.playerMgr.minimizeEmbededPlayer(this);
      else
      {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    var closeBtn = document.createElementNS(XUL_NS, 'image');
    box2.appendChild(closeBtn);
    closeBtn.setAttribute('width','14px');
    closeBtn.setAttribute('height','14px');
    closeBtn.classList.add('extUI');
    closeBtn.classList.add('buttonUI');
    closeBtn.classList.add('closeWindowBtn');
    closeBtn.onclick = function(e){
      if(e.button==0)
        bbsfox.playerMgr.closeEmbededPlayer(this);
      else
      {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    var box3 = document.createElementNS(XUL_NS, 'hbox');
    box1.appendChild(box3);
    box3.classList.add('extUI');
    box3.classList.add('dragUI');
    box3.classList.add('nonspan');

    // XUL <menulist> not working in E10S (Firefox bug ?)
    // Modify: Use html tag <select>
    var sizeSelect;
    if(bbscore.prefs.overlayPrefs.remoteBrowser) {
      sizeSelect = document.createElement('select');
      box3.appendChild(sizeSelect);
      sizeSelect.style.fontSize='12px';
      sizeSelect.style.margin='4px 2px';
      sizeSelect.setAttribute('editable','false');
      sizeSelect.classList.add('extUI');
      sizeSelect.classList.add('buttonUI');
      sizeSelect.classList.add('WinBtn');
      sizeSelect.setAttribute('sizetopopup','always');
      //
      var resArr = ['425 x 344 (4:3)', '480 x 385 (4:3)', '640 x 505 (4:3)', '960 x 745 (4:3)',
                    '560 x 340 (16:9)', '640 x 385 (16:9)', '853 x 505 (16:9)', '1280 x 745 (16:9)'];
      for(var i=0;i<resArr.length;++i)
      {
        var option = document.createElement('option');
        option.text = resArr[i];
        option.value = i;
        option.classList.add('extUI');
        sizeSelect.appendChild(option);
      }
      //
      sizeSelect.selectedIndex = playerSize;
      sizeSelect.addEventListener('change', this.selectitem.bind(this), false);
    } else {
      sizeSelect = document.createElementNS(XUL_NS, 'menulist');
      box3.appendChild(sizeSelect);
      sizeSelect.style.fontSize='12px';
      sizeSelect.setAttribute('editable','false');
      sizeSelect.classList.add('extUI');
      sizeSelect.classList.add('buttonUI');
      sizeSelect.classList.add('WinBtn');
      sizeSelect.setAttribute('sizetopopup','always');
      sizeSelect.insertItemAt(0, '1280 x 745 (16:9)', 7);
      sizeSelect.insertItemAt(0, '853 x 505 (16:9)', 6);
      sizeSelect.insertItemAt(0, '640 x 385 (16:9)', 5);
      sizeSelect.insertItemAt(0, '560 x 340 (16:9)', 4);
      sizeSelect.insertItemAt(0, '960 x 745 (4:3)', 3);
      sizeSelect.insertItemAt(0, '640 x 505 (4:3)', 2);
      sizeSelect.insertItemAt(0, '480 x 385 (4:3)', 1);
      sizeSelect.insertItemAt(0, '425 x 344 (4:3)', 0);
      sizeSelect.selectedIndex = playerSize;
      sizeSelect.addEventListener('command', this.selectitem.bind(this), false);
    }

    var copyUrlBtn = document.createElementNS(XUL_NS, 'button');
    box3.appendChild(copyUrlBtn);
    copyUrlBtn.classList.add('extUI');
    copyUrlBtn.classList.add('buttonUI');
    copyUrlBtn.classList.add('sBtn');
    copyUrlBtn.style.width = 'auto';
    copyUrlBtn.label = bbsfox.getLM("copyUrl");
    copyUrlBtn.onclick = function(){
      bbsfox.playerMgr.copyEmbededPlayerUrl(this);
    };
    if(showbtn)
      copyUrlBtn.style.display = 'inline';
    else
      copyUrlBtn.style.display = 'none';

    var clientDiv = document.createElementNS(XUL_NS, 'div');
    box1.appendChild(clientDiv);

    var playerDiv2 = document.createElementNS(XUL_NS, 'div');
    BBSWin.appendChild(playerDiv2);
    playerDiv2.classList.add('extUI');
    playerDiv2.classList.add('dragUI');
    playerDiv2.classList.add('drag');
    playerDiv2.style.zindex='4';
    playerDiv2.style.display = 'none';
    playerDiv2.style.left = '10px';
    playerDiv2.style.top = '10px';
    playerDiv2.style.backgroundColor = '#ffbbbb';
    playerDiv2.style.padding = '3px';
    playerDiv2.style.border = '1px double #ff0000';
    //playerDiv2.style.MozBorderRadius = '8px'; //there have som bug in firefox, set this style, div become low z-index then flash embedded
    playerDiv2.style.cursor = 'default';
    playerDiv2.addEventListener('mousedown', this.mousedown.bind(this), false);
    playerDiv2.addEventListener('mouseup', this.mouseup.bind(this), false);  //maybe we need handle this event in global...

    var box4 = document.createElementNS(XUL_NS, 'vbox');
    playerDiv2.appendChild(box4);

    var box5 = document.createElementNS(XUL_NS, 'hbox');
    box4.appendChild(box5);

    var spacer2 = document.createElementNS(XUL_NS, 'spacer');
    box5.appendChild(spacer2);
    spacer2.setAttribute('flex','2');
    spacer2.classList.add('extUI');
    spacer2.classList.add('dragUI');
    spacer2.classList.add('nonspan');
    spacer2.style.width = '18px';

    var restoreBtn = document.createElementNS(XUL_NS, 'image');
    box5.appendChild(restoreBtn);
    restoreBtn.setAttribute('width','14px');
    restoreBtn.setAttribute('height','14px');
    restoreBtn.classList.add('extUI');
    restoreBtn.classList.add('buttonUI');
    restoreBtn.classList.add('restoreWindowBtn');

    restoreBtn.onclick = function(e){
      if(e.button==0)
        bbsfox.playerMgr.restoreEmbededPlayer(this);
      else
      {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    var closeBtn2 = document.createElementNS(XUL_NS, 'image');
    box5.appendChild(closeBtn2);
    closeBtn2.setAttribute('width','14px');
    closeBtn2.setAttribute('height','14px');
    closeBtn2.classList.add('extUI');
    closeBtn2.classList.add('buttonUI');
    closeBtn2.classList.add('closeWindowBtn');
    closeBtn2.onclick = function(e){
      if(e.button==0)
        bbsfox.playerMgr.closeEmbededPlayer(this);
      else
      {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    this.box1 = box1;
    this.playerDiv = playerDiv;
    this.closeBtn = closeBtn;
    this.minBtn = minBtn;
    this.copyUrlBtn = copyUrlBtn;
    this.clientDiv = clientDiv;
    this.sizeSelect = sizeSelect;

    this.movieDiv = null;//movieDiv;

    this.playerDiv2 = playerDiv2;
    this.closeBtn2 = closeBtn2;
    this.restoreBtn = restoreBtn;
    //this.movieDiv2 = movieDiv2;
    this.xmlhttp = null;
    this.iframe = null;
    this.iobject = null;
    this.ptype = '';
    this.playerURL = playerURL;

    this.offX = 0;
    this.offY = 0;
    this.tempCurX = 0;
    this.tempCurY = 0;
}

EmbeddedPlayer.prototype={

  timerMinWindow: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),

  selectitem: function(event) {
    var w;
    var h;
    var code = null;
    switch (this.sizeSelect.selectedIndex) {
      case 1:w=480;h=385;break;
      case 2:w=640;h=505;break;
      case 3:w=960;h=745;break;
      case 4:w=560;h=340;break;
      case 5:w=640;h=385;break;
      case 6:w=853;h=505;break;
      case 7:w=1280;h=745;break;
      default:w=425;h=344;break;
    }
    if(this.sizeSelect.getAttribute('YoutubeCode')!='')
    {
      code= this.sizeSelect.getAttribute('YoutubeCode');
      //bbsfox.playerMgr.reloadEmbeddedPlayer(this, code, w, h);
    }
    else if(this.sizeSelect.getAttribute('UstreamCode')!='')
    {
      code= this.sizeSelect.getAttribute('UstreamCode');
      //bbsfox.playerMgr.reloadEmbeddedPlayer(this, code, w, h);
    }
    else if(this.sizeSelect.getAttribute('UrecordCode')!='')
    {
      code= this.sizeSelect.getAttribute('UrecordCode');
      //bbsfox.playerMgr.reloadEmbeddedPlayer(this, code, w, h);
    }
    else
      return;
    this.playerDiv.style.display = 'block';
    this.openPlayerWindow(this.ptype ,code, w, h, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
  },

  mousedown: function(event) {
    if(event.target.classList.contains('buttonUI') || event.target.tagName.indexOf('menuitem') >= 0)
      return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    if(event.button==0) //left button
    {
      //this.dragapproved = true;
      var maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;
      if(this.playerDiv2.style.display == 'none')
      {
        this.playerDiv.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.playerDiv.style.left);
        this.tempCurY = parseFloat(this.playerDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", '1');
      }
      else
      {
        this.playerDiv2.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.playerDiv2.style.left);
        this.tempCurY = parseFloat(this.playerDiv2.style.top);
        this.CmdHandler.setAttribute("DragingWindow", '2');
      }
      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
      if(event.target.classList.contains('dragUI'))
      {
        bbsfox.playerMgr.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow",'0');
    bbsfox.playerMgr.dragingWindow = null;
  },

  removeAllChild: function(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
  },

  setChildByString: function(n, str) {
    var dp = new DOMParser();
    var doc = dp.parseFromString(str, "text/html");
    this.removeAllChild(n);
    n.appendChild(doc.body.firstChild);
  },

  createLinkStr: function(pt, code, w, h, loop, autoPlay, autoUseHighQuality) {
    if(pt=='Y')
    {
      var loopstr = '0';
      var autoplaystr = '0';
      var highqualitystr = '0';
      if(loop)
        loopstr = '1';
      if(autoPlay)
        autoplaystr = '1';
      if(autoUseHighQuality)
        highqualitystr = '1';
      return '<html:iframe class="extUI youtube-player" allowfullscreen="1" type="text/html" width="'+w+'" height="'+h+'" src="http://www.youtube.com/embed/'+code+'?hl=zh_TW&fs=1&rel=0&loop='+loopstr+'&autoplay='+autoplaystr+'&hd='+highqualitystr+'&enablejsapi=1" frameborder="0"></html:iframe>';
    }
    else if(pt=='U')
    {
      var autoplaystr = 'false';
      if(autoPlay)
        autoplaystr = 'true';
      //return '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="'+w+'" height="'+h+'" id="utv939441"><param name="flashvars" value="autoplay='+autoplaystr+'&amp;brand=embed&amp;cid='+code+'&amp;v3=1"/><param name="allowfullscreen" value="true"/><param name="allowscriptaccess" value="always"/><param name="movie" value="http://www.ustream.tv/flash/viewer.swf"/><embed flashvars="autoplay='+autoplaystr+'&amp;brand=embed&amp;cid='+code+'&amp;v3=1" width="'+w+'" height="'+h+'" allowfullscreen="true" allowscriptaccess="always" id="utv939441" name="utv_n_544965" src="http://www.ustream.tv/flash/viewer.swf" type="application/x-shockwave-flash" /></object>';
      return '<embed flashvars="autoplay='+autoplaystr+'&amp;brand=embed&amp;cid='+code+'&amp;v3=1" width="'+w+'" height="'+h+'" allowfullscreen="true" allowscriptaccess="always" id="utv939441" name="utv_n_544965" src="http://www.ustream.tv/flash/viewer.swf" type="application/x-shockwave-flash" />';
    }
    else if(pt=='R')
    {
      var autoplaystr = 'false';
      if(autoPlay)
        autoplaystr = 'true';
      return '<object type="application/x-shockwave-flash" data="http://static-cdn1.ustream.tv/swf/live/viewer:211.swf?vrsl=c:532&amp;ulbr=100" width="'+w+'" height="'+h+'"><param name="wmode" value="direct" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="flashvars" value="vid='+code+'&amp;locale=en_US&amp;sessionid=&amp;autoplay='+autoplaystr+'&amp;enablejsapi=1&amp;sv=6" /></object>';
    }
  },

  getUstreamPlayerID: function(code)
  {
    this.ptype = 'U';
    this.xmlhttp = new XMLHttpRequest();
    this.xmlhttp.onreadystatechange = function() {bbsfox.playerMgr.onPlayWindowResponse(this);};
    this.xmlhttp.open("GET",code,true);
    this.xmlhttp.send(null);
  },

  openPlayerWindow: function(pt, code, w, h, loop, autoPlay, autoUseHighQuality)
  {
    this.ptype = pt;
    if(pt=='Y')
    {
      if(!this.movieDiv)
      {
        this.movieDiv = document.createElementNS(XUL_NS, 'div'); //can't work...
        this.box1.appendChild(this.movieDiv);
      }
      if(this.iframe){
        this.movieDiv.removeChild(this.iframe);
        this.iframe = null;
      }
      if(this.iframe==null){
        this.iframe = document.createElement('iframe');
        this.movieDiv.appendChild(this.iframe);
        this.iframe.classList.add('extUI');
        this.iframe.classList.add('youtube-player');
        this.iframe.setAttribute('type','text/html');
        this.iframe.setAttribute('frameborder',0);
        this.iframe.setAttribute('allowfullscreen', '1');
      }
      var autoplaystr = '0';
      if(autoPlay)
        autoplaystr = '1';
      var scrstr = 'https://www.youtube.com/embed/'+code+'?enablejsapi=1&hl=zh_TW&autoplay='+autoplaystr;
      if(loop)
        scrstr+=("&loop=1&playlist=" + code);
      else
        scrstr+="&loop=0";
      if(autoUseHighQuality)
        scrstr+="&vq=highres";
      this.iframe.setAttribute('width',w);
      this.iframe.setAttribute('height',h);
      this.iframe.setAttribute('src',scrstr);
    }
    else if(pt=='U')
    {
      if(!this.movieDiv)
      {
        //this.movieDiv = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        this.movieDiv = document.createElement('div');
        this.box1.appendChild(this.movieDiv);
      }
      this.setChildByString(this.movieDiv, this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality));
      //this.movieDiv.innerHTML = this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality);
    }
    else if(pt=='R')
    {
      if(!this.movieDiv)
      {
        //this.movieDiv = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        this.movieDiv = document.createElement('div');
        this.box1.appendChild(this.movieDiv);
      }
      this.setChildByString(this.movieDiv, this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality));
      //this.movieDiv.innerHTML = this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality);
    }
    /*
    else if(pt=='O')
    {
      if(!this.movieDiv)
      {
        //this.movieDiv = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        this.movieDiv = document.createElement('div');
        this.box1.appendChild(this.movieDiv);
      }
      this.movieDiv.innerHTML = this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality);
    }
    */
    //this.movieDiv.innerHTML = this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality);
    this.xmlhttp = null;
  },

  SetCopyUrlBtn: function(show)
  {
    if(show)
      this.copyUrlBtn.style.display = 'inline';
    else
      this.copyUrlBtn.style.display = 'none';
  },

  copyPlayerWindowUrl: function()
  {
      var clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                      .getService(Components.interfaces.nsIClipboardHelper);
      clipboardHelper.copyString(this.playerURL);
  },

  minPlayerWindow: function()
  {
      this.timerMinWindow.cancel();
      var maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;
      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
      if(this.playerDiv2.style.display == 'none')
      {
        var sindex = this.sizeSelect.selectedIndex;
        var l = parseFloat(this.playerDiv.style.left);
        var t = parseFloat(this.playerDiv.style.top);
        if(l<0)l=0;
        if(t<0)t=0;
        var w;
        var h;
        if(sindex==0){w=425;h=344;}
        else if(sindex==1){w=480;h=385;}
        else if(sindex==2){w=640;h=505;}
        else if(sindex==3){w=960;h=745;}
        else if(sindex==4){w=560;h=340;}
        else if(sindex==5){w=640;h=385;}
        else if(sindex==6){w=853;h=505;}
        else if(sindex==7){w=1280;h=745;}
        this.playerDiv2.style.width = w+12+'px';
        this.playerDiv2.style.height = h+57+'px';
        this.playerDiv2.style.left = l+'px';
        this.playerDiv2.style.top = t+'px';
        this.playerDiv2.style.display = 'block';
        this.playerDiv2.style.zIndex = maxzindex;
        this.playerDiv.style.left = -10000000 + 'px';
        this.minWindow();
      }
      else if(this.playerDiv2.style.display == 'block')
      {
        this.restroeWindow();
      }
  },

  quickMinPlayerWindow: function()
  {
      if(this.playerDiv2.style.display == 'none')
      {
        var sindex = this.sizeSelect.selectedIndex;
        var l = parseFloat(this.playerDiv.style.left);
        var t = parseFloat(this.playerDiv.style.top);
        if(l<0)l=0;
        if(t<0)t=0;
        var w;
        var h;
        if(sindex==0){w=425;h=344;}
        else if(sindex==1){w=480;h=385;}
        else if(sindex==2){w=640;h=505;}
        else if(sindex==3){w=960;h=745;}
        else if(sindex==4){w=560;h=340;}
        else if(sindex==5){w=640;h=385;}
        else if(sindex==6){w=853;h=505;}
        else if(sindex==7){w=1280;h=745;}
        this.playerDiv2.style.width = w+12+'px';
        this.playerDiv2.style.height = h+57+'px';
        this.playerDiv2.style.left = l+'px';
        this.playerDiv2.style.top = t+'px';
        this.playerDiv2.style.display = 'block';
        this.playerDiv.style.left = -10000000 + 'px';
        this.playerDiv2.style.width = '54px';
        this.playerDiv2.style.height = '21px';
      }
      else if(this.playerDiv2.style.display == 'block')
      {
        this.restroeWindow();
      }
  },

  minWindow: function()
  {
      var nw = parseFloat(this.playerDiv2.style.width);
      var nh = parseFloat(this.playerDiv2.style.height);
      nw = nw/1.6;
      nh = nh/1.6;

      if(nw<54 || nh<21)
      {
        this.playerDiv2.style.width = '54px';
        this.playerDiv2.style.height = '21px';
      }
      else
      {
        this.playerDiv2.style.width = nw+'px';
        this.playerDiv2.style.height = nh+'px';
        this.timerMinWindow.initWithCallback(this, 40, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
      }
  },

  restroeWindow: function()
  {
      var maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;
      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);

      if(this.playerDiv2.style.display == 'block')
      {
        var l = parseFloat(this.playerDiv2.style.left);
        var t = parseFloat(this.playerDiv2.style.top);
        this.playerDiv2.style.display = 'none';
        this.playerDiv.style.left = l + 'px';
        this.playerDiv.style.top = t + 'px';
        this.playerDiv.style.zIndex = maxzindex;
      }
  },

  notify: function(timer) {
    if(timer==this.timerMinWindow)
        this.minWindow();
  }
};

function EmbeddedPlayerMgr(bbscore) {
  this.bbscore = bbscore;
  this.BBSWin = document.getElementById('BBSWindow');
  this.dragingWindow = null;
  this.embeddedPlayerSize = 0;
  this.epAutoPlay = false;
  this.epLoop = false;
  this.epAutoUseHQ = false;
  this.epCopyUrlButton = false;
  this.epWindowWidth = 425;
  this.epWindowHeight = 344;
  this.eplayers=[];
}

EmbeddedPlayerMgr.prototype={
  timerMinWindow: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),
  youtubeRegEx: /(https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([A-Za-z0-9._%-]*)|https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*))/i,
  youtubeRegEx1: /https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([A-Za-z0-9._%-]*)/i,
  youtubeRegEx2: /https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*)/i,
  ustreamRegEx: /(http:\/\/www\.ustream\.tv\/(channel|channel-popup)\/([A-Za-z0-9._%-]*))/i,
  urecordRegEx: /(http:\/\/www\.ustream\.tv\/recorded\/([0-9]{5,10}))/i,

  openUrecordWindow: function(aurl) {
    var tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl=='')
      return;
    if(!this.urecordRegEx.test(aurl))
      return;
    var i = aurl.lastIndexOf('/');
    if(i!=-1)
      aurl = aurl.substr(i+1,aurl.length);
    //i = aurl.indexOf('=');
    //aurl = aurl.substring(i+1, aurl.length);
    var embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
    this.eplayers.push(embeddedPlayer);
    embeddedPlayer.playerDiv.display = 'none';
    embeddedPlayer.playerDiv.style.left = '10px';
    embeddedPlayer.playerDiv.style.top = '10px';
    embeddedPlayer.playerDiv.style.display = 'block';
    embeddedPlayer.sizeSelect.setAttribute('UstreamCode','');
    embeddedPlayer.sizeSelect.setAttribute('YoutubeCode','');
    embeddedPlayer.sizeSelect.setAttribute('UrecordCode',aurl);
    //embeddedPlayer.opt[this.embeddedPlayerSize].selected = true;
    embeddedPlayer.openPlayerWindow('R', aurl, this.epWindowWidth, this.epWindowHeight, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
  },

  testURL: function(aurl) {
    if(this.youtubeRegEx.test(aurl))
      return 1;
    else if(this.ustreamRegEx.test(aurl))
      return 2;
    else if(this.urecordRegEx.test(aurl))
      return 3;
    else
      return 0;
  },

  openUstreamWindow: function(aurl) {
    var tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl=='')
      return;

    if(!this.ustreamRegEx.test(aurl))
      return;

    var embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
    this.eplayers.push(embeddedPlayer);
    embeddedPlayer.playerDiv.display = 'none';
    embeddedPlayer.playerDiv2.display = 'none';
    embeddedPlayer.playerDiv.style.left = '10px';
    embeddedPlayer.playerDiv.style.top = '10px';
    embeddedPlayer.playerDiv.style.display = 'block';
    embeddedPlayer.sizeSelect.setAttribute('UstreamCode','');
    embeddedPlayer.sizeSelect.setAttribute('YoutubeCode','');
    embeddedPlayer.sizeSelect.setAttribute('UrecordCode','');
    //embeddedPlayer.opt[this.embeddedPlayerSize].selected = true;
    embeddedPlayer.getUstreamPlayerID(aurl);
  },

  openYoutubeWindow: function(aurl) {
    var tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl=='')
      return;
    var youtubeURLType = 0;
    if(this.youtubeRegEx1.test(aurl))
    {
      youtubeURLType = 1;
      var res = this.youtubeRegEx1.exec(aurl);
      aurl = res[1];
    }
    else if(this.youtubeRegEx2.test(aurl))
    {
      youtubeURLType = 2;
      var res = this.youtubeRegEx2.exec(aurl);
      aurl = res[1];
    }

    if(youtubeURLType==1 || youtubeURLType==2)
    {
      tempurl = 'https://www.youtube.com/watch?v='+aurl;
      var embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
      this.eplayers.push(embeddedPlayer);
      embeddedPlayer.playerDiv.display = 'none';
      embeddedPlayer.playerDiv.style.left = '10px';
      embeddedPlayer.playerDiv.style.top = '10px';
      embeddedPlayer.playerDiv.style.display = 'block';
      embeddedPlayer.sizeSelect.setAttribute('YoutubeCode',aurl);
      embeddedPlayer.sizeSelect.setAttribute('UstreamCode','');
      embeddedPlayer.sizeSelect.setAttribute('UrecordCode','');
      //embeddedPlayer.opt[this.embeddedPlayerSize].selected = true;
      embeddedPlayer.openPlayerWindow('Y', aurl, this.epWindowWidth, this.epWindowHeight, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
    }
  },

  setDefaultWindowSize: function(size) {
    this.embeddedPlayerSize = size;
    switch (this.embeddedPlayerSize) {
      case 1:this.epWindowWidth = 480;this.epWindowHeight = 385;break;
      case 2:this.epWindowWidth = 640;this.epWindowHeight = 505;break;
      case 3:this.epWindowWidth = 960;this.epWindowHeight = 745;break;
      case 4:this.epWindowWidth = 560;this.epWindowHeight = 340;break;
      case 5:this.epWindowWidth = 640;this.epWindowHeight = 385;break;
      case 6:this.epWindowWidth = 853;this.epWindowHeight = 505;break;
      case 7:this.epWindowWidth = 1280;this.epWindowHeight = 745;break;
      default:this.epWindowWidth = 425;this.epWindowHeight = 344;break;
    }
  },

  onPlayWindowResponse: function(xmlhttp) {
    try
    {
      if(xmlhttp.readyState ==4)
      {
        if(xmlhttp.status == 200)
        {
          var contentText = xmlhttp.responseText;
          var start = contentText.indexOf("cid=");
          contentText = contentText.substr(start+4,15);
          start = contentText.indexOf("&");
          contentText = contentText.substr(0,start);
          for(var i=0;i<this.eplayers.length;++i)
          {
            if(this.eplayers[i].xmlhttp == xmlhttp)
            {
              this.eplayers[i].sizeSelect.setAttribute('UstreamCode',contentText);
              this.eplayers[i].openPlayerWindow(this.eplayers[i].ptype ,contentText, this.epWindowWidth, this.epWindowHeight, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
              xmlhttp.abort();
              break;
            }
          }
        }
        else
        {
          //alert("Problem retrieving XML data");
        }
      }
    }
    catch(e)
    {
      //alert('err');
    }
  },

  reloadEmbeddedPlayer: function(sel, code, w, h) {
    for(var i=0;i<this.eplayers.length;++i)
    {
      if(this.eplayers[i].sizeSelect == sel)
      {
        this.eplayers[i].playerDiv.style.display = 'block';
        this.eplayers[i].openPlayerWindow(this.eplayers[i].ptype ,code, w, h, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
        break;
      }
    }
  },

  copyEmbededPlayerUrl: function(btn) {
    for(var i=0;i<this.eplayers.length;++i)
    {
      if(this.eplayers[i].copyUrlBtn == btn)
      {
        this.eplayers[i].copyPlayerWindowUrl();
        break;
      }
    }
  },

  minimizeEmbededPlayer: function(btn) {
    for(var i=0;i<this.eplayers.length;++i)
    {
      if(this.eplayers[i].minBtn == btn)
      {
        this.eplayers[i].minPlayerWindow();
        break;
      }
    }
  },

  restoreEmbededPlayer: function(btn) {
    for(var i=0;i<this.eplayers.length;++i)
    {
      if(this.eplayers[i].restoreBtn == btn)
      {
        this.eplayers[i].restroeWindow();
        break;
      }
    }
  },

  closeEmbededPlayer: function(btn) {
    var findflag = false;
    var player = null;
    for(var i=0;i<this.eplayers.length;++i)
    {
      if(this.eplayers[i].closeBtn == btn || this.eplayers[i].closeBtn2 == btn)
      {
        this.BBSWin.removeChild(this.eplayers[i].playerDiv );
        this.BBSWin.removeChild(this.eplayers[i].playerDiv2 );
        player = this.eplayers[i];
        findflag = true;
        break;
      }
    }

    if(findflag)
    {
      for(var i=0,n=0;i<this.eplayers.length;++i)
        if(this.eplayers[i]!=player)
          this.eplayers[n++] = this.eplayers[i];
      this.eplayers.length -= 1;
    }
    //this.resetTabIcon();
  },

  minimizeAllEmbededPlayer: function() {
    if(this.eplayers.length>1)
    {
      for(var i=0;i<this.eplayers.length;++i)
        this.eplayers[i].quickMinPlayerWindow();
    }
    else
    {
      for(var i=0;i<this.eplayers.length;++i)
        this.eplayers[i].minPlayerWindow();
    }
  },

  restoreAllEmbededPlayer: function() {
    for(var i=0;i<this.eplayers.length;++i)
      this.eplayers[i].restroeWindow();
  },

  closeAllEmbededPlayer: function() {
    for(var i=0;i<this.eplayers.length;++i)
    {
      this.BBSWin.removeChild(this.eplayers[i].playerDiv );
      this.BBSWin.removeChild(this.eplayers[i].playerDiv2 );
    }
    this.eplayers.length = 0;
    //this.resetTabIcon();
  },

  setAllEmbededPlayerUrlBtn: function(show) {
    for(var i=0;i<this.eplayers.length;++i)
      this.eplayers[i].SetCopyUrlBtn(show);
  }
};