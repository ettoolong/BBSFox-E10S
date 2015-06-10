function AnsiColorTool(bbscore) {
  this.CmdHandler = document.getElementById('cmdHandler');
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
  this.previewStr = '';
  this.dp = new DOMParser();
}
AnsiColorTool.prototype={
  selectitem: function(event) {
    var pageindex = this.pageSelect.selectedIndex;
    for(var i=0;i<this.btns.length;++i)
    {
      if(i < this.symbles[pageindex].length)
      {
          this.btns[i].label = this.symbles[pageindex][i];
          this.btns[i].hidden = false;
      }
      else
        this.btns[i].hidden = true;
    }
  },

  mousedown: function(event) {
    if(event.target.classList.contains('buttonUI'))
      return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    if(event.button==0) //left button
    {
      if(event.target.classList.contains('dragUI'))
      {
        this.tempCurX = parseInt(this.mainDiv.style.left);
        this.tempCurY = parseInt(this.mainDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", '4');
        this.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow",'0');
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
    var outputArr = [];
    if(withFg && this.fg > 7)
      outputArr.push('1');
    if(withFg && this.blink)
      outputArr.push('5');
    if(withFg)
      outputArr.push('3'+(this.fg%8));
    if(withBg)
      outputArr.push('4'+(this.bg));
    return this.bbscore.prefs.EscChar + '[' + outputArr.join(';') +'m';
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
    if(event.button==0)
      this.closeWindow();
    else
    {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  updatePreview: function() {
    if(this.previewStr=='')
      this.previewStr = this.bbscore.getLM('preview');

    var str = '';
    str +='<span class="extUI dragUI nonspan previewText q' + this.fg + ' b' + this.bg + '">'+ (this.blink?'<x s="q'+ this.fg + ' b'+ this.bg + '" h="qq'+ this.bg + '"></x>':'');
    str += this.previewStr;
    str += '</span>';

    var doc = this.dp.parseFromString(str, "text/html");
    var n = this.previewDiv;
    if(n.firstChild)
      n.replaceChild(doc.body.firstChild, n.firstChild);
    else
      n.appendChild(doc.body.firstChild);
  },

  createPageDiv: function(divParent, divClass, divVisible)
  {
    var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var newDiv = document.createElementNS(XUL_NS, 'div');
    divParent.appendChild(newDiv);
    newDiv.classList.add('extUI');
    newDiv.classList.add('dragUI');
    newDiv.classList.add(divClass);
    newDiv.hidden = false;
    return newDiv;
  },

  createVbox: function(boxParent)
  {
    var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var newVbox = document.createElementNS(XUL_NS, 'vbox');
    boxParent.appendChild(newVbox);
    return newVbox;
  },

  createHbox: function(boxParent)
  {
    var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var newHbox = document.createElementNS(XUL_NS, 'hbox');
    boxParent.appendChild(newHbox);
    return newHbox;
  },

  createBtn: function(btnParent, cb)
  {
    var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var newBtn = document.createElementNS(XUL_NS, 'button');
    btnParent.appendChild(newBtn);
    newBtn.addEventListener('click', cb, false);
    newBtn.classList.add('extUI');
    newBtn.classList.add('buttonUI');
    newBtn.classList.add('sBtn');
    return newBtn;
  },

  displayWindow: function()
  {
    if(!this.init) {
      this.initWindow();
      this.init = true;
    } else {
      this.mainDiv.style.display = 'block';
    }
    this.bbscore.prefs.updateOverlayPrefs([{key:'ansiColorToolOpened', value:true}]);
  },

  closeWindow: function()
  {
    this.bbscore.prefs.updateOverlayPrefs([{key:'ansiColorToolOpened', value:false}]);
    this.mainDiv.style.display = 'none';
  },

  switchWindow: function()
  {
    if(this.mainDiv==null || this.mainDiv.style.display == 'none')
      this.displayWindow();
    else
      this.closeWindow();
  },

  ///
  initWindow: function()
  {
      var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      var BBSWin = document.getElementById('BBSWindow');
      var mainDiv = document.createElementNS(XUL_NS, 'div');
      BBSWin.appendChild(mainDiv);
      mainDiv.classList.add('extUI');
      mainDiv.classList.add('dragUI');
      mainDiv.classList.add('drag');
      mainDiv.classList.add('ansiColorTool');
      mainDiv.style.left = '10px';
      mainDiv.style.top = '10px';
      //mainDiv.style.opacity = '1';
      //mainDiv.style.borderRadius = '8px'; //there have some bug in firefox, set this style, div become lower z-index then flash embedded
      this.mainDiv = mainDiv;
      mainDiv.addEventListener('mousedown', this.mousedown.bind(this), false);
      mainDiv.addEventListener('mouseup', this.mouseup.bind(this), false);

      var box1 = document.createElementNS(XUL_NS, 'vbox');
      mainDiv.appendChild(box1);

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

      var closeBtn = document.createElementNS(XUL_NS, 'image');
      box2.appendChild(closeBtn);
      closeBtn.setAttribute('width','14px');
      closeBtn.setAttribute('height','14px');
      closeBtn.classList.add('extUI');
      closeBtn.classList.add('buttonUI');
      closeBtn.classList.add('closeWindowBtn');
      closeBtn.addEventListener('click', this.btnCloseClick.bind(this), false);

      var box3 = document.createElementNS(XUL_NS, 'hbox');
      box1.appendChild(box3);
      box3.classList.add('extUI');
      box3.classList.add('dragUI');
      box3.classList.add('nonspan');
      box3.align="center";
      box3.style.fontSize = "14px";
      var textNode = document.createElementNS(XUL_NS, 'label');
      textNode.classList.add('extUI');
      textNode.classList.add('dragUI');
      textNode.classList.add('nonspan');
      textNode.setAttribute('value', this.bbscore.getLM('foreground'));
      box3.appendChild(textNode);
      this.checkbox = document.createElementNS(XUL_NS, 'checkbox');
      this.checkbox.classList.add('extUI');
      this.checkbox.classList.add('buttonUI');
      this.checkbox.setAttribute('label', this.bbscore.getLM('blink'));
      this.checkbox.addEventListener('CheckboxStateChange', this.checkboxClick.bind(this), false);
      box3.appendChild(this.checkbox);

      var clientDiv = document.createElementNS(XUL_NS, 'div');
      box1.appendChild(clientDiv);

      var buttonDiv = this.createPageDiv(clientDiv, 'buttonDiv', true);
      var vbox = this.createVbox(buttonDiv);
      var hbox;
      var setFgColorCb = this.setFgColorCb.bind(this);
      for(var i=0;i<16;++i)
      {
        if(i%8==0)
        {
          hbox = this.createHbox(vbox);
          hbox.classList.add('extUI');
          hbox.classList.add('dragUI');
          hbox.classList.add('nonspan');
        }
        var newbtn = this.createBtn(hbox, setFgColorCb);
        //this.btns.push(newbtn);
        newbtn.label = '\u2588';
        newbtn.width = '10px';
        newbtn.setAttribute('colorIndex', i);
        newbtn.classList.add('q'+i);
      }

      var box4 = document.createElementNS(XUL_NS, 'hbox');
      box1.appendChild(box4);
      box4.classList.add('extUI');
      box4.classList.add('dragUI');
      box4.classList.add('nonspan');
      box4.style.fontSize = "14px";
      textNode = document.createElementNS(XUL_NS, 'label');
      textNode.classList.add('extUI');
      textNode.classList.add('dragUI');
      textNode.classList.add('nonspan');
      textNode.setAttribute('value', this.bbscore.getLM('background'));
      box4.appendChild(textNode);

      clientDiv = document.createElementNS(XUL_NS, 'div');
      box1.appendChild(clientDiv);
      buttonDiv = this.createPageDiv(clientDiv, 'buttonDiv', true);
      var vbox = this.createVbox(buttonDiv);
      var hbox;
      var setBgColorCb = this.setBgColorCb.bind(this);
      for(var i=0;i<8;++i)
      {
        if(i%8==0)
        {
          hbox = this.createHbox(vbox);
          hbox.classList.add('extUI');
          hbox.classList.add('dragUI');
          hbox.classList.add('nonspan');
        }
        var newbtn = this.createBtn(hbox, setBgColorCb);
        //this.btns.push(newbtn);
        newbtn.label = '\u2588';
        newbtn.width = '10px';
        newbtn.setAttribute('colorIndex', i);
        newbtn.classList.add('q'+i);
      }
      var previewDiv = document.createElementNS(XUL_NS, 'div');
      this.previewDiv = previewDiv;
      previewDiv.classList.add('extUI');
      previewDiv.classList.add('dragUI');
      previewDiv.classList.add('nonspan');
      previewDiv.style.width = '30px';
      previewDiv.style.height = '30px'
      previewDiv.style.color = '#FFF'
      previewDiv.style.background = '#000';
      previewDiv.style.margin = '2px 5px';
      previewDiv.style.padding = '5px';
      box1.appendChild(previewDiv);

      hbox = this.createHbox(box1);
      var newbtn1 = this.createBtn(hbox, this.sendFgColorCode.bind(this));
      newbtn1.setAttribute('label', this.bbscore.getLM('sendForegroundColorCode'));
      var newbtn2 = this.createBtn(hbox, this.sendBgColorCode.bind(this));
      newbtn2.setAttribute('label', this.bbscore.getLM('sendBackgroundColorCode'));
      hbox = this.createHbox(box1);
      var newbtn3 = this.createBtn(hbox, this.sendAnsiColorCode.bind(this));
      newbtn3.setAttribute('label', this.bbscore.getLM('sendAnsiColorCode'));
      var newbtn4 = this.createBtn(hbox, this.sendResetColorCode.bind(this));
      newbtn4.setAttribute('label', this.bbscore.getLM('sendResetColorCode'));

      this.updatePreview();
  }
};
