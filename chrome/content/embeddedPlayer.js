function EmbeddedPlayer(bbscore, playerURL, showbtn, playerSize) {
  this.CmdHandler = document.getElementById('cmdHandler');
  //this.opt = new Array(8);

  let BBSWin = document.getElementById("BBSWindow");
  let playerDiv = document.createElementNS(XUL_NS, "div");
  BBSWin.appendChild(playerDiv);
  playerDiv.classList.add("extUI", "dragUI", "drag", "embedPlayer");
  playerDiv.style.left = "10px";
  playerDiv.style.top = "10px";
  playerDiv.addEventListener("mousedown", event => { this.mousedown(event); }, false);
  playerDiv.addEventListener("mouseup", event => { this.mouseup(event); }, false);

  let box1 = document.createElementNS(XUL_NS, "vbox");
  playerDiv.appendChild(box1);

  let box2 = document.createElementNS(XUL_NS, "hbox");
  box1.appendChild(box2);
  box2.classList.add("extUI", "dragUI", "nonspan");

  let spacer1 = document.createElementNS(XUL_NS, "spacer");
  box2.appendChild(spacer1);
  spacer1.setAttribute("flex", "1");
  spacer1.classList.add("extUI", "dragUI", "nonspan");

  let minBtn = document.createElementNS(XUL_NS, "image");
  box2.appendChild(minBtn);
  minBtn.setAttribute("width", "14px");
  minBtn.setAttribute("height", "14px");
  minBtn.classList.add("extUI", "buttonUI", "minWindowBtn");
  minBtn.onclick = e => {
    if(e.button==0) {
      bbsfox.playerMgr.minimizeEmbededPlayer(this);
    }
    else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  let closeBtn = document.createElementNS(XUL_NS, "image");
  box2.appendChild(closeBtn);
  closeBtn.setAttribute("width", "14px");
  closeBtn.setAttribute("height", "14px");
  closeBtn.classList.add("extUI", "buttonUI", "closeWindowBtn");
  closeBtn.onclick = e => {
    if(e.button==0) {
      bbsfox.playerMgr.closeEmbededPlayer(this);
    }
    else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  let box3 = document.createElementNS(XUL_NS, "hbox");
  box1.appendChild(box3);
  box3.classList.add("extUI", "dragUI", "nonspan");

  let sizeSelect = document.createElement("select");
  box3.appendChild(sizeSelect);
  sizeSelect.style.fontSize = "12px";
  sizeSelect.style.margin = "4px 2px";
  sizeSelect.setAttribute("editable", "false");
  sizeSelect.setAttribute('sizetopopup','always');
  sizeSelect.classList.add("extUI", "buttonUI", "WinBtn");
  //
  let resArr = ["425 x 344 (4:3)",
                "480 x 385 (4:3)",
                "640 x 505 (4:3)",
                "960 x 745 (4:3)",
                "560 x 340 (16:9)",
                "640 x 385 (16:9)",
                "853 x 505 (16:9)",
                "1280 x 745 (16:9)"];
  for(let i=0;i<resArr.length;++i) {
    let option = document.createElement("option");
    option.text = resArr[i];
    option.value = i;
    option.classList.add("extUI");
    sizeSelect.appendChild(option);
  }
  //
  sizeSelect.selectedIndex = playerSize;
  sizeSelect.addEventListener("change", event => { this.selectitem(event); }, false);

  let copyUrlBtn = document.createElementNS(XUL_NS, "button");
  box3.appendChild(copyUrlBtn);
  copyUrlBtn.classList.add("extUI", "buttonUI", "sBtn");
  copyUrlBtn.style.width = "auto";
  copyUrlBtn.label = bbsfox.getLM("copyUrl");
  copyUrlBtn.onclick = () => {
    bbsfox.playerMgr.copyEmbededPlayerUrl(this);
  };
  if(showbtn)
    copyUrlBtn.style.display = "inline";
  else
    copyUrlBtn.style.display = "none";

  let clientDiv = document.createElementNS(XUL_NS, "div");
  box1.appendChild(clientDiv);

  let playerDiv2 = document.createElementNS(XUL_NS, "div");
  BBSWin.appendChild(playerDiv2);
  playerDiv2.classList.add("extUI", "dragUI", "drag");
  playerDiv2.style.zindex = "4";
  playerDiv2.style.display = "none";
  playerDiv2.style.left = "10px";
  playerDiv2.style.top = "10px";
  playerDiv2.style.backgroundColor = "#ffbbbb";
  playerDiv2.style.padding = "3px";
  playerDiv2.style.border = "1px double #ff0000";
  //playerDiv2.style.MozBorderRadius = '8px'; //there have som bug in firefox, set this style, div become low z-index then flash embedded
  playerDiv2.style.cursor = "default";
  playerDiv2.addEventListener("mousedown", event => { this.mousedown(event); }, false);
  playerDiv2.addEventListener("mouseup", event => { this.mouseup(event); }, false);  //maybe we need handle this event in global...

  let box4 = document.createElementNS(XUL_NS, "vbox");
  playerDiv2.appendChild(box4);

  let box5 = document.createElementNS(XUL_NS, "hbox");
  box4.appendChild(box5);

  let spacer2 = document.createElementNS(XUL_NS, "spacer");
  box5.appendChild(spacer2);
  spacer2.setAttribute("flex", "2");
  spacer2.classList.add("extUI", "dragUI", "nonspan");
  spacer2.style.width = "18px";

  let restoreBtn = document.createElementNS(XUL_NS, "image");
  box5.appendChild(restoreBtn);
  restoreBtn.setAttribute("width", "14px");
  restoreBtn.setAttribute("height", "14px");
  restoreBtn.classList.add("extUI", "buttonUI", "restoreWindowBtn");

  restoreBtn.onclick = e => {
    if(e.button==0) {
      bbsfox.playerMgr.restoreEmbededPlayer(this);
    }
    else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  let closeBtn2 = document.createElementNS(XUL_NS, "image");
  box5.appendChild(closeBtn2);
  closeBtn2.setAttribute("width", "14px");
  closeBtn2.setAttribute("height", "14px");
  closeBtn2.classList.add("extUI", "buttonUI", "closeWindowBtn");
  closeBtn2.onclick = e => {
    if(e.button==0) {
      bbsfox.playerMgr.closeEmbededPlayer(this);
    }
    else {
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

EmbeddedPlayer.prototype = {

  selectitem: function(event) {
    let w;
    let h;
    let code = null;
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
    if(this.sizeSelect.getAttribute("YoutubeCode") != "") {
      code = this.sizeSelect.getAttribute("YoutubeCode");
    }
    else if(this.sizeSelect.getAttribute("UstreamCode") != "") {
      code = this.sizeSelect.getAttribute("UstreamCode");
    }
    else if(this.sizeSelect.getAttribute("UrecordCode") != "") {
      code = this.sizeSelect.getAttribute("UrecordCode");
    }
    else {
      return;
    }
    this.playerDiv.style.display = "block";
    this.openPlayerWindow(this.ptype ,code, w, h, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
  },

  mousedown: function(event) {
    if(event.target.classList.contains("buttonUI") ||
       event.target.tagName === "SELECT" ||
       event.target.tagName === "OPTION" ) {
      return;
    }

    this.offX = event.pageX;
    this.offY = event.pageY;
    if(event.button==0) {//left button
      //this.dragapproved = true;
      let maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;
      if(this.playerDiv2.style.display == "none") {
        this.playerDiv.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.playerDiv.style.left);
        this.tempCurY = parseFloat(this.playerDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", "1");
      }
      else {
        this.playerDiv2.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.playerDiv2.style.left);
        this.tempCurY = parseFloat(this.playerDiv2.style.top);
        this.CmdHandler.setAttribute("DragingWindow", "2");
      }
      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
      if(event.target.classList.contains("dragUI")) {
        bbsfox.playerMgr.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow", "0");
    bbsfox.playerMgr.dragingWindow = null;
  },

  removeAllChild: function(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
  },

  setChildByString: function(n, str) {
    let dp = new DOMParser();
    let doc = dp.parseFromString(str, "text/html");
    this.removeAllChild(n);
    n.appendChild(doc.body.firstChild);
  },

  createLinkStr: function(pt, code, w, h, loop, autoPlay, autoUseHighQuality) {
    if(pt == "Y") {
      let loopstr = loop ? "1" : "0";
      let autoplaystr = autoPlay ? "1" : "0";
      let highqualitystr = autoUseHighQuality ? "1" : "0";
      return "<html:iframe class='extUI youtube-player' allowfullscreen='1' type='text/html' width='" + w + "' height='" + h + "' src='http://www.youtube.com/embed/" + code + "?hl=zh_TW&fs=1&rel=0&loop=" + loopstr + "&autoplay=" + autoplaystr + "&hd=" + highqualitystr + "&enablejsapi=1' frameborder='0'></html:iframe>";
    }
    else if(pt == "U") {
      let autoplaystr = autoPlay ? "true" : "false";
      //return '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="'+w+'" height="'+h+'" id="utv939441"><param name="flashvars" value="autoplay='+autoplaystr+'&amp;brand=embed&amp;cid='+code+'&amp;v3=1"/><param name="allowfullscreen" value="true"/><param name="allowscriptaccess" value="always"/><param name="movie" value="http://www.ustream.tv/flash/viewer.swf"/><embed flashvars="autoplay='+autoplaystr+'&amp;brand=embed&amp;cid='+code+'&amp;v3=1" width="'+w+'" height="'+h+'" allowfullscreen="true" allowscriptaccess="always" id="utv939441" name="utv_n_544965" src="http://www.ustream.tv/flash/viewer.swf" type="application/x-shockwave-flash" /></object>';
      return "<embed flashvars='autoplay=" + autoplaystr + "&amp;brand=embed&amp;cid=" + code + "&amp;v3=1' width='" + w + "' height='" + h + "' allowfullscreen='true' allowscriptaccess='always' id='utv939441' name='utv_n_544965' src='http://www.ustream.tv/flash/viewer.swf' type='application/x-shockwave-flash' />";
    }
    else if(pt == "R") {
      let autoplaystr = autoPlay ? "true" : "false";
      return "<object type='application/x-shockwave-flash' data='http://static-cdn1.ustream.tv/swf/live/viewer:211.swf?vrsl=c:532&amp;ulbr=100' width='" + w + "' height='" + h + "'><param name='wmode' value='direct' /><param name='allowfullscreen' value='true' /><param name='allowscriptaccess' value='always' /><param name='flashvars' value='vid=" + code + "&amp;locale=en_US&amp;sessionid=&amp;autoplay=" + autoplaystr + "&amp;enablejsapi=1&amp;sv=6' /></object>";
    }
  },

  getUstreamPlayerID: function(code) {
    this.ptype = "U";
    this.xmlhttp = new XMLHttpRequest();
    this.xmlhttp.onreadystatechange = function() {bbsfox.playerMgr.onPlayWindowResponse(this);};
    this.xmlhttp.open("GET", code, true);
    this.xmlhttp.send(null);
  },

  openPlayerWindow: function(pt, code, w, h, loop, autoPlay, autoUseHighQuality) {
    this.ptype = pt;
    if(pt == "Y") {
      if(!this.movieDiv) {
        this.movieDiv = document.createElementNS(XUL_NS, "div"); //can't work...
        this.box1.appendChild(this.movieDiv);
      }
      if(this.iframe) {
        this.movieDiv.removeChild(this.iframe);
        this.iframe = null;
      }
      if(this.iframe==null) {
        this.iframe = document.createElement("iframe");
        this.movieDiv.appendChild(this.iframe);
        this.iframe.classList.add("extUI", "youtube-player");
        this.iframe.setAttribute("type", "text/html");
        this.iframe.setAttribute("frameborder", 0);
        this.iframe.setAttribute("allowfullscreen", "1");
      }
      let autoplaystr = autoPlay ? "1" : "0";
      let scrstr = "https://www.youtube.com/embed/" + code + "?enablejsapi=1&hl=zh_TW&autoplay=" + autoplaystr;
      if(loop)
        scrstr += ("&loop=1&playlist=" + code);
      else
        scrstr += "&loop=0";
      if(autoUseHighQuality)
        scrstr += "&vq=highres";
      this.iframe.setAttribute("width", w);
      this.iframe.setAttribute("height", h);
      this.iframe.setAttribute("src", scrstr);
    }
    else if(pt == "U") {
      if(!this.movieDiv)
      {
        //this.movieDiv = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        this.movieDiv = document.createElement("div");
        this.box1.appendChild(this.movieDiv);
      }
      this.setChildByString(this.movieDiv, this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality));
    }
    else if(pt == "R") {
      if(!this.movieDiv)
      {
        //this.movieDiv = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        this.movieDiv = document.createElement("div");
        this.box1.appendChild(this.movieDiv);
      }
      this.setChildByString(this.movieDiv, this.createLinkStr(pt, code, w, h, loop, autoPlay, autoUseHighQuality));
    }
    this.xmlhttp = null;
  },

  SetCopyUrlBtn: function(show) {
    this.copyUrlBtn.style.display = show ? "inline" : "none";
  },

  copyPlayerWindowUrl: function() {
    let clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    clipboardHelper.copyString(this.playerURL);
  },

  minPlayerWindow: function() {
    let maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
    ++maxzindex;
    this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
    if(this.playerDiv2.style.display == "none") {
      let sindex = this.sizeSelect.selectedIndex;
      let l = parseFloat(this.playerDiv.style.left);
      let t = parseFloat(this.playerDiv.style.top);
      if(l<0)l=0;
      if(t<0)t=0;
      let w;
      let h;
      if(sindex==0){w=425;h=344;}
      else if(sindex==1){w=480;h=385;}
      else if(sindex==2){w=640;h=505;}
      else if(sindex==3){w=960;h=745;}
      else if(sindex==4){w=560;h=340;}
      else if(sindex==5){w=640;h=385;}
      else if(sindex==6){w=853;h=505;}
      else if(sindex==7){w=1280;h=745;}
      this.playerDiv2.style.width = w + 12 + "px";
      this.playerDiv2.style.height = h + 57 + "px";
      this.playerDiv2.style.left = l + "px";
      this.playerDiv2.style.top = t + "px";
      this.playerDiv2.style.display = "block";
      this.playerDiv2.style.zIndex = maxzindex;
      this.playerDiv.style.left = -10000000 + "px";
      this.playerDiv2.classList.add("minWindiw");
    }
    else if(this.playerDiv2.style.display == "block") {
      this.playerDiv2.classList.remove("minWindiw");
      this.restroeWindow();
    }
  },

  quickMinPlayerWindow: function() {
    if(this.playerDiv2.style.display == "none") {
      let sindex = this.sizeSelect.selectedIndex;
      let l = parseFloat(this.playerDiv.style.left);
      let t = parseFloat(this.playerDiv.style.top);
      if(l<0)l=0;
      if(t<0)t=0;
      this.playerDiv2.style.left = l + "px";
      this.playerDiv2.style.top = t + "px";
      this.playerDiv2.style.display = "block";
      this.playerDiv.style.left = -10000000 + "px";
      this.playerDiv2.style.width = "54px";
      this.playerDiv2.style.height = "21px";
    }
    else if(this.playerDiv2.style.display == "block") {
      this.restroeWindow();
    }
  },

  restroeWindow: function() {
    let maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
    ++maxzindex;
    this.CmdHandler.setAttribute("MaxZIndex", maxzindex);

    if(this.playerDiv2.style.display == "block")
    {
      let l = parseFloat(this.playerDiv2.style.left);
      let t = parseFloat(this.playerDiv2.style.top);
      this.playerDiv2.style.display = "none";
      this.playerDiv.style.left = l + "px";
      this.playerDiv.style.top = t + "px";
      this.playerDiv.style.zIndex = maxzindex;
    }
  }
};

function EmbeddedPlayerMgr(bbscore) {
  this.bbscore = bbscore;
  this.BBSWin = document.getElementById("BBSWindow");
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

EmbeddedPlayerMgr.prototype = {
  youtubeRegEx: /(https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([A-Za-z0-9._%-]*)|https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*))/i,
  youtubeRegEx1: /https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([A-Za-z0-9._%-]*)/i,
  youtubeRegEx2: /https?:\/\/youtu\.be\/([A-Za-z0-9._%-]*)/i,
  ustreamRegEx: /(http:\/\/www\.ustream\.tv\/(channel|channel-popup)\/([A-Za-z0-9._%-]*))/i,
  urecordRegEx: /(http:\/\/www\.ustream\.tv\/recorded\/([0-9]{5,10}))/i,

  openVideoWindow: function(aurl) {
    let testresult = this.testURL(aurl);
    if(testresult === 1)
      this.openYoutubeWindow(aurl);
    else if(testresult === 2)
      this.openUstreamWindow(aurl);
    else if(testresult === 3)
      this.openUrecordWindow(aurl);
  },

  openUrecordWindow: function(aurl) {
    let tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl == "")
      return;
    if(!this.urecordRegEx.test(aurl))
      return;
    let i = aurl.lastIndexOf("/");
    if(i!=-1)
      aurl = aurl.substr(i+1,aurl.length);
    //i = aurl.indexOf('=');
    //aurl = aurl.substring(i+1, aurl.length);
    let embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
    this.eplayers.push(embeddedPlayer);
    embeddedPlayer.playerDiv.display = "none";
    embeddedPlayer.playerDiv.style.left = "10px";
    embeddedPlayer.playerDiv.style.top = "10px";
    embeddedPlayer.playerDiv.style.display = "block";
    embeddedPlayer.sizeSelect.setAttribute("UstreamCode", "");
    embeddedPlayer.sizeSelect.setAttribute("YoutubeCode", "");
    embeddedPlayer.sizeSelect.setAttribute("UrecordCode", aurl);
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
    let tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl == "")
      return;

    if(!this.ustreamRegEx.test(aurl))
      return;

    let embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
    this.eplayers.push(embeddedPlayer);
    embeddedPlayer.playerDiv.display = "none";
    embeddedPlayer.playerDiv2.display = "none";
    embeddedPlayer.playerDiv.style.left = "10px";
    embeddedPlayer.playerDiv.style.top = "10px";
    embeddedPlayer.playerDiv.style.display = "block";
    embeddedPlayer.sizeSelect.setAttribute("UstreamCode", "");
    embeddedPlayer.sizeSelect.setAttribute("YoutubeCode", "");
    embeddedPlayer.sizeSelect.setAttribute("UrecordCode", "");
    //embeddedPlayer.opt[this.embeddedPlayerSize].selected = true;
    embeddedPlayer.getUstreamPlayerID(aurl);
  },

  openYoutubeWindow: function(aurl) {
    let tempurl = aurl;
    //this.setInputAreaFocus();
    if(aurl == "")
      return;

    let youtubeURLType = 0;
    if(this.youtubeRegEx1.test(aurl)) {
      youtubeURLType = 1;
      let res = this.youtubeRegEx1.exec(aurl);
      aurl = res[1];
    }
    else if(this.youtubeRegEx2.test(aurl)) {
      youtubeURLType = 2;
      let res = this.youtubeRegEx2.exec(aurl);
      aurl = res[1];
    }

    if(youtubeURLType == 1 || youtubeURLType == 2) {
      tempurl = "https://www.youtube.com/watch?v=" + aurl;
      let embeddedPlayer = new EmbeddedPlayer(this.bbscore, tempurl, this.epCopyUrlButton, this.embeddedPlayerSize);
      this.eplayers.push(embeddedPlayer);
      embeddedPlayer.playerDiv.display = "none";
      embeddedPlayer.playerDiv.style.left = "10px";
      embeddedPlayer.playerDiv.style.top = "10px";
      embeddedPlayer.playerDiv.style.display = "block";
      embeddedPlayer.sizeSelect.setAttribute("YoutubeCode", aurl);
      embeddedPlayer.sizeSelect.setAttribute("UstreamCode", "");
      embeddedPlayer.sizeSelect.setAttribute("UrecordCode", "");
      //embeddedPlayer.opt[this.embeddedPlayerSize].selected = true;
      embeddedPlayer.openPlayerWindow("Y", aurl, this.epWindowWidth, this.epWindowHeight, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
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
    try {
      if(xmlhttp.readyState ==4) {
        if(xmlhttp.status == 200) {
          let contentText = xmlhttp.responseText;
          let start = contentText.indexOf("cid=");
          contentText = contentText.substr(start+4,15);
          start = contentText.indexOf("&");
          contentText = contentText.substr(0,start);
          for (let eplayer of this.eplayers) {
            if(eplayer.xmlhttp == xmlhttp) {
              eplayer.sizeSelect.setAttribute("UstreamCode", contentText);
              eplayer.openPlayerWindow(eplayer.ptype ,contentText, this.epWindowWidth, this.epWindowHeight, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
              xmlhttp.abort();
              break;
            }
          }
        }
        else {
          //alert("Problem retrieving XML data");
        }
      }
    }
    catch(e) {
      //alert('err');
    }
  },

  // reloadEmbeddedPlayer: function(sel, code, w, h) {
  //   for(let eplayer of this.eplayers) {
  //     if(eplayer.sizeSelect == sel) {
  //       eplayer.playerDiv.style.display = 'block';
  //       eplayer.openPlayerWindow(eplayer.ptype ,code, w, h, this.epLoop, this.epAutoPlay, this.epAutoUseHQ);
  //       break;
  //     }
  //   }
  // },

  copyEmbededPlayerUrl: function(target) {
    for(let eplayer of this.eplayers) {
      if(eplayer === target) {
        eplayer.copyPlayerWindowUrl();
        break;
      }
    }
  },

  minimizeEmbededPlayer: function(target) {
    for(let eplayer of this.eplayers) {
      if(eplayer === target) {
        eplayer.minPlayerWindow();
        break;
      }
    }
  },

  restoreEmbededPlayer: function(target) {
    for(let eplayer of this.eplayers) {
      if(eplayer === target) {
        eplayer.restroeWindow();
        break;
      }
    }
  },

  closeEmbededPlayer: function(target) {
    this.eplayers = this.eplayers.filter( eplayer => {
      if(eplayer === target) {
        this.BBSWin.removeChild(eplayer.playerDiv );
        this.BBSWin.removeChild(eplayer.playerDiv2 );
        return false;
      }
      else {
        return true;
      }
    });
  },

  minimizeAllEmbededPlayer: function() {
    if(this.eplayers.length>1) {
      for(let eplayer of this.eplayers) {
        eplayer.quickMinPlayerWindow();
      }
    }
    else {
      for(let eplayer of this.eplayers) {
        eplayer.minPlayerWindow();
      }
    }
  },

  restoreAllEmbededPlayer: function() {
    for(let eplayer of this.eplayers)
      eplayer.restroeWindow();
  },

  closeAllEmbededPlayer: function() {
    for(let eplayer of this.eplayers) {
      this.BBSWin.removeChild(eplayer.playerDiv );
      this.BBSWin.removeChild(eplayer.playerDiv2 );
    }
    this.eplayers.length = 0;
  },

  setAllEmbededPlayerUrlBtn: function(show) {
    for(let eplayer of this.eplayers)
      eplayer.SetCopyUrlBtn(show);
  }
};
