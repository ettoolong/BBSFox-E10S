function SymbolInput(bbscore) {
  this.CmdHandler = document.getElementById('cmdHandler');
  this.bbscore = bbscore;
  this.pageSelect = null;
  this.mainDiv = null;
  this.init = false;

  this.btns = [];
  this.symbles = [];

  this.symbolPageCount = 12;
  let keydata, i;
  let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  let ssm = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
  let sp = ssm.getSystemPrincipal();
  let channel = ioService.newChannel2("chrome://bbsfox/content/res/keyboard.res", //aSpec
                       null, //aOriginCharset
                       null, //aBaseURI
                       null, //aLoadingNode
                       sp, //aLoadingPrincipal
                       null, //aTriggeringPrincipal
                       Ci.nsILoadInfo.SEC_NORMAL, //aSecurityFlags
                       Ci.nsIContentPolicy.TYPE_OTHER); //aContentPolicyType

  let ins = channel.open();
  let scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"].getService(Ci.nsIScriptableInputStream);
  let unicodeConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  unicodeConverter.charset = "UTF-8";
  scriptableStream.init(ins);
  let str = scriptableStream.read(ins.available());
  scriptableStream.close();
  ins.close();
  keydata = unicodeConverter.ConvertToUnicode( str );
  let strArray = keydata.split("\r\n");
  for(i = 0; i < this.symbolPageCount; ++i)
    this.symbles[i] = strArray[i].split(",");

  this.offX = 0;
  this.offY = 0;
  this.tempCurX = 0;
  this.tempCurY = 0;
  this.dragingWindow = null;
  this.symInputBoxAlpha = 85;
}

SymbolInput.prototype = {
  selectitem: function(event) {
    let pageindex = this.pageSelect.selectedIndex;
    let i;
    for(i = 0; i < this.btns.length; ++i) {
      if(i < this.symbles[pageindex].length) {
        this.btns[i].label = this.symbles[pageindex][i];
        this.btns[i].hidden = false;
      }
      else {
        this.btns[i].hidden = true;
      }
    }
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
      if(event.target.classList.contains("dragUI")) {
        this.tempCurX = parseInt(this.mainDiv.style.left);
        this.tempCurY = parseInt(this.mainDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", "3");
        this.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow", "0");
    this.dragingWindow = null;
  },

  btnSymClick: function(event) {
    this.bbscore.symbtnclick(event);
  },

  btnCloseClick: function(event) {
    if(event.button==0)
      this.closeWindow();
    else
    {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  createPageDiv: function(divParent, divClass, divVisible) {
    let newDiv = document.createElementNS(XUL_NS, "div");
    divParent.appendChild(newDiv);
    newDiv.classList.add("extUI", "dragUI");
    newDiv.classList.add(divClass);
    newDiv.hidden = false;
    return newDiv;
  },

  createVbox: function(boxParent) {
    let newVbox = document.createElementNS(XUL_NS, "vbox");
    boxParent.appendChild(newVbox);
    return newVbox;
  },

  createHbox: function(boxParent) {
    let newHbox = document.createElementNS(XUL_NS, "hbox");
    boxParent.appendChild(newHbox);
    return newHbox;
  },

  createBtn: function(btnParent, cb) {
    let newBtn = document.createElementNS(XUL_NS, "button");
    btnParent.appendChild(newBtn);
    newBtn.addEventListener("click", cb, false);
    newBtn.classList.add("extUI", "buttonUI", "sBtn");
    newBtn.width = "10px";
    return newBtn;
  },

  setWindowAlpha: function(alpha) {
    this.symInputBoxAlpha = alpha;
    if(this.mainDiv) {
      this.mainDiv.style.opacity = this.symInputBoxAlpha == 0 ? "1" : "0." + (100-this.symInputBoxAlpha);
    }
  },

  displayWindow: function() {
    if(!this.init) {
      this.initWindow();
      this.init = true;
    }
    else {
      this.mainDiv.style.display = "block";
    }
    this.bbscore.prefs.status.screenKeyboardOpened = true;
  },

  closeWindow: function() {
    this.bbscore.prefs.status.screenKeyboardOpened = false;
    this.mainDiv.style.display = "none";
  },

  switchWindow: function() {
    if(this.mainDiv == null || this.mainDiv.style.display == "none")
      this.displayWindow();
    else
      this.closeWindow();
  },

  ///
  initWindow: function() {
    let BBSWin = document.getElementById("BBSWindow");
    let mainDiv = document.createElementNS(XUL_NS, "div");
    BBSWin.appendChild(mainDiv);
    mainDiv.classList.add("extUI", "dragUI", "drag", "symbolInput");
    mainDiv.style.left = "10px";
    mainDiv.style.top = "10px";
    mainDiv.style.opacity = this.symInputBoxAlpha == 0 ? "1" : '0.' + (100-this.symInputBoxAlpha);
    this.mainDiv = mainDiv;
    mainDiv.addEventListener("mousedown", event => { this.mousedown(event) }, false);
    mainDiv.addEventListener("mouseup", event => { this.mouseup(event) }, false);

    let box1 = document.createElementNS(XUL_NS, "vbox");
    mainDiv.appendChild(box1);

    let box2 = document.createElementNS(XUL_NS, "hbox");
    box1.appendChild(box2);
    box2.classList.add("extUI", "dragUI", "nonspan");

    let spacer1 = document.createElementNS(XUL_NS, "spacer");
    box2.appendChild(spacer1);
    spacer1.setAttribute("flex", "1");
    spacer1.classList.add("extUI", "dragUI", "nonspan");

    var closeBtn = document.createElementNS(XUL_NS, "image");
    box2.appendChild(closeBtn);
    closeBtn.setAttribute("width", "14px");
    closeBtn.setAttribute("height", "14px");
    closeBtn.classList.add("extUI", "buttonUI", "closeWindowBtn");
    closeBtn.addEventListener("click", event => { this.btnCloseClick(event) }, false);

    var box3 = document.createElementNS(XUL_NS, "hbox");
    box1.appendChild(box3);
    box3.classList.add("extUI", "dragUI", "nonspan");

    var pageSelect = document.createElement("select");
    box3.appendChild(pageSelect);
    pageSelect.style.fontSize = "12px";
    pageSelect.style.margin = "4px 2px";
    pageSelect.setAttribute("editable", "false");
    pageSelect.classList.add("extUI", "buttonUI", "WinBtn");
    pageSelect.setAttribute("id", "sympageselect");
    pageSelect.setAttribute("sizetopopup", "always");

    let i, j;
    for(i = 0; i < this.symbolPageCount; ++i) {
      let str = this.bbscore.getLM("symbolList" + i);
      let option = document.createElement("option");
      option.text = str;
      option.value = i;
      option.classList.add("extUI");
      pageSelect.appendChild(option);
    }

    pageSelect.selectedIndex = 0;
    this.pageSelect = pageSelect;
    pageSelect.addEventListener("change", event => { this.selectitem(event) }, false);

    let clientDiv = document.createElementNS(XUL_NS, "div");
    box1.appendChild(clientDiv);

    this.buttonDiv = this.createPageDiv(clientDiv, "buttonDiv", true);
    let vbox = this.createVbox(this.buttonDiv);
    let hbox;
    let btnCb = this.btnSymClick.bind(this);
    for(j = 0 ; j < 71; ++j) {
      if(j%10 === 0) {
        hbox = this.createHbox(vbox);
        hbox.classList.add("extUI", "dragUI", "nonspan");
      }
      let newbtn = this.createBtn(hbox, btnCb);
      this.btns.push(newbtn);
      if(j < this.symbles[0].length) {
        newbtn.label = this.symbles[0][j];
      }
      else {
        newbtn.label = "";
        newbtn.hidden = true;
      }
    }
  }
};
