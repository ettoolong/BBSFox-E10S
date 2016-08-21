function AnsiColorTool(bbscore) {
  this.CmdHandler = document.getElementById("cmdHandler");
  this.bbscore = bbscore;
  this.pageSelect = null;
  this.mainDiv = null;
  this.init = false;

  this.offX = 0;
  this.offY = 0;
  this.tempCurX = 0;
  this.tempCurY = 0;
  this.dragingWindow = null;
  this.fg = 7;
  this.bg = 0;
  this.blink = false;
  this.previewStr = "";
  this.dp = new DOMParser();
}

AnsiColorTool.prototype = {
  mousedown: function(event) {
    if(event.target.classList.contains("buttonUI"))
      return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    if(event.button==0) {//left button
      if(event.target.classList.contains("dragUI")) {
        this.tempCurX = parseInt(this.mainDiv.style.left);
        this.tempCurY = parseInt(this.mainDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", "4");
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

  setFgColorCb: function(event) {
    this.fg = parseInt(event.target.getAttribute("colorIndex"));
    this.updatePreview();
  },

  setBgColorCb: function(event) {
    this.bg = parseInt(event.target.getAttribute("colorIndex"));
    this.updatePreview();
  },

  getAnsiColorCode: function(withFg, withBg) {
    let outputArr = [];
    if(withFg && this.fg > 7)
      outputArr.push("1");
    if(withFg && this.blink)
      outputArr.push("5");
    if(withFg)
      outputArr.push("3"+(this.fg%8));
    if(withBg)
      outputArr.push("4"+(this.bg));
    return this.bbscore.prefs.EscChar + "[" + outputArr.join(";") + "m";
  },

  sendAnsiColorCode: function(event) {
    this.bbscore.conn.send( this.getAnsiColorCode(true, true) );
  },

  sendResetColorCode: function(event) {
    this.bbscore.conn.send( this.getAnsiColorCode(false, false) );
  },

  sendFgColorCode: function(event) {
    this.bbscore.conn.send( this.getAnsiColorCode(true, false) );
  },

  sendBgColorCode: function(event) {
    this.bbscore.conn.send( this.getAnsiColorCode(false, true) );
  },

  checkboxClick: function(event) {
    this.blink = event.target.checked;
    this.updatePreview();
  },

  btnCloseClick: function(event) {
    if(event.button==0) {
      this.closeWindow();
    }
    else {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  updatePreview: function() {
    if(this.previewStr == "")
      this.previewStr = this.bbscore.getLM("preview");

    let str = "";
    str += "<span class='extUI dragUI nonspan previewText q" + this.fg + " b" + this.bg + "'>";
    str += this.blink ? "<x s='q" + this.fg + " b"+ this.bg + "' h='qq" + this.bg + "'></x>" : "";
    str += this.previewStr;
    str += "</span>";

    let doc = this.dp.parseFromString(str, "text/html");
    let n = this.previewDiv;
    if(n.firstChild)
      n.replaceChild(doc.body.firstChild, n.firstChild);
    else
      n.appendChild(doc.body.firstChild);
  },

  createPageDiv: function(divParent, divClass, divVisible) {
    let newDiv = document.createElementNS(XUL_NS, "div");
    divParent.appendChild(newDiv);
    newDiv.classList.add("extUI", "dragUI", divClass);
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

  createColorBtn: function(btnParent, cb) {
    let newBtn = document.createElementNS(XUL_NS, "div");
    btnParent.appendChild(newBtn);
    newBtn.addEventListener("click", cb, false);
    newBtn.classList.add("extUI", "buttonUI", "sBtn", "colorBtn");
    return newBtn;
  },

  createBtn: function(btnParent, cb) {
    let newBtn = document.createElementNS(XUL_NS, "button");
    btnParent.appendChild(newBtn);
    newBtn.addEventListener("click", cb, false);
    newBtn.classList.add("extUI", "buttonUI", "sBtn");
    return newBtn;
  },

  displayWindow: function() {
    if(!this.init) {
      this.initWindow();
      this.init = true;
    }
    else {
      this.mainDiv.style.display = "block";
    }
    this.bbscore.prefs.status.ansiColorToolOpened = true;
  },

  closeWindow: function() {
    this.bbscore.prefs.status.ansiColorToolOpened = false;
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
    mainDiv.classList.add("extUI", "dragUI", "drag", "ansiColorTool");
    mainDiv.style.left = "10px";
    mainDiv.style.top = "10px";
    //mainDiv.style.opacity = '1';
    //mainDiv.style.borderRadius = '8px'; //there have some bug in firefox, set this style, div become lower z-index then flash embedded
    this.mainDiv = mainDiv;
    mainDiv.addEventListener("mousedown", this.mousedown.bind(this), false);
    mainDiv.addEventListener("mouseup", this.mouseup.bind(this), false);

    let box1 = document.createElementNS(XUL_NS, "vbox");
    mainDiv.appendChild(box1);

    let box2 = document.createElementNS(XUL_NS, "hbox");
    box1.appendChild(box2);
    box2.classList.add("extUI", "dragUI", "nonspan");

    let spacer1 = document.createElementNS(XUL_NS, "spacer");
    box2.appendChild(spacer1);
    spacer1.setAttribute("flex", "1");
    spacer1.classList.add("extUI", "dragUI", "nonspan");

    let closeBtn = document.createElementNS(XUL_NS, "image");
    box2.appendChild(closeBtn);
    closeBtn.setAttribute("width", "14px");
    closeBtn.setAttribute("height", "14px");
    closeBtn.classList.add("extUI", "buttonUI", "closeWindowBtn");
    closeBtn.addEventListener("click", this.btnCloseClick.bind(this), false);

    let box3 = document.createElementNS(XUL_NS, "hbox");
    box1.appendChild(box3);
    box3.classList.add("extUI", "dragUI", "nonspan");
    box3.align = "center";
    box3.style.fontSize = "14px";

    let textNode = document.createElementNS(XUL_NS, "label");
    textNode.classList.add("extUI", "dragUI", "nonspan");
    textNode.setAttribute("value", this.bbscore.getLM("foreground"));
    box3.appendChild(textNode);

    this.checkbox = document.createElementNS(XUL_NS, "checkbox");
    this.checkbox.classList.add("extUI", "buttonUI");
    this.checkbox.setAttribute('label', this.bbscore.getLM("blink"));
    this.checkbox.addEventListener("CheckboxStateChange", this.checkboxClick.bind(this), false);
    box3.appendChild(this.checkbox);

    let clientDiv = document.createElementNS(XUL_NS, "div");
    box1.appendChild(clientDiv);

    let buttonDiv = this.createPageDiv(clientDiv, "buttonDiv", true);
    let vbox = this.createVbox(buttonDiv);
    let hbox;
    let setFgColorCb = this.setFgColorCb.bind(this);
    for(let i = 0; i < 16; ++i) {
      if(i%8==0) {
        hbox = this.createHbox(vbox);
        hbox.classList.add("extUI", "dragUI", "nonspan");
      }
      let newbtn = this.createColorBtn(hbox, setFgColorCb);
      newbtn.width = "10px";
      newbtn.setAttribute("colorIndex", i);
      newbtn.classList.add("fb"+i);
    }

    let box4 = document.createElementNS(XUL_NS, "hbox");
    box1.appendChild(box4);
    box4.classList.add("extUI", "dragUI", "nonspan");
    box4.style.fontSize = "14px";
    box4.style.marginTop = "10px";
    textNode = document.createElementNS(XUL_NS, "label");
    textNode.classList.add("extUI", "dragUI", "nonspan");
    textNode.setAttribute('value', this.bbscore.getLM("background"));
    box4.appendChild(textNode);

    clientDiv = document.createElementNS(XUL_NS, "div");
    box1.appendChild(clientDiv);
    buttonDiv = this.createPageDiv(clientDiv, "buttonDiv", true);
    vbox = this.createVbox(buttonDiv);
    let setBgColorCb = this.setBgColorCb.bind(this);
    for(let i = 0; i < 8; ++i) {
      if(i%8==0) {
        hbox = this.createHbox(vbox);
        hbox.classList.add("extUI", "dragUI", "nonspan");
      }
      let newbtn = this.createColorBtn(hbox, setBgColorCb);
      newbtn.width = "10px";
      newbtn.setAttribute("colorIndex", i);
      newbtn.classList.add("fb"+i);
    }
    let previewDiv = document.createElementNS(XUL_NS, "div");
    this.previewDiv = previewDiv;
    previewDiv.classList.add("extUI", "dragUI", "nonspan", "colorPreview");
    box1.appendChild(previewDiv);

    hbox = this.createHbox(box1);
    let newbtn1 = this.createBtn(hbox, this.sendFgColorCode.bind(this));
    newbtn1.setAttribute("label", this.bbscore.getLM("sendForegroundColorCode"));
    let newbtn2 = this.createBtn(hbox, this.sendBgColorCode.bind(this));
    newbtn2.setAttribute("label", this.bbscore.getLM("sendBackgroundColorCode"));
    hbox = this.createHbox(box1);
    let newbtn3 = this.createBtn(hbox, this.sendAnsiColorCode.bind(this));
    newbtn3.setAttribute("label", this.bbscore.getLM("sendAnsiColorCode"));
    let newbtn4 = this.createBtn(hbox, this.sendResetColorCode.bind(this));
    newbtn4.setAttribute("label", this.bbscore.getLM("sendResetColorCode"));

    this.updatePreview();
  }
};
