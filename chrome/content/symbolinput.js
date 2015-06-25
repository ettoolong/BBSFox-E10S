const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

function SymbolInput(bbscore) {
  this.CmdHandler = document.getElementById('cmdHandler');
  this.bbscore = bbscore;
  this.pageSelect = null;
  this.mainDiv = null;
  this.init = false;

  this.btns = [];
  this.symbles = [];

  this.symbolPageCount = 12;
  var keydata;
  var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
  var channel = ioService.newChannel('resource://bbsfox/keyboard.res', null, null);
  var ins = channel.open();
  var scriptableStream=Components.classes["@mozilla.org/scriptableinputstream;1"].getService(Components.interfaces.nsIScriptableInputStream);
  var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  unicodeConverter.charset = 'UTF-8';
  scriptableStream.init(ins);
  var str=scriptableStream.read(ins.available());
  scriptableStream.close();
  ins.close();
  keydata =  unicodeConverter.ConvertToUnicode( str );
  var strArray = keydata.split('\r\n');
  for(var i=0;i<this.symbolPageCount;++i)
    this.symbles[i] = strArray[i].split(",");

  this.offX = 0;
  this.offY = 0;
  this.tempCurX = 0;
  this.tempCurY = 0;
  this.dragingWindow = null;
  this.symInputBoxAlpha = 85;
}
SymbolInput.prototype={
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
    if(event.target.classList.contains('buttonUI') || event.target.tagName.indexOf('menuitem') >= 0)
      return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    if(event.button==0) //left button
    {
      if(event.target.classList.contains('dragUI'))
      {
        this.tempCurX = parseInt(this.mainDiv.style.left);
        this.tempCurY = parseInt(this.mainDiv.style.top);
        this.CmdHandler.setAttribute("DragingWindow", '3');
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

  createPageDiv: function(divParent, divClass, divVisible)
  {
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
    var newVbox = document.createElementNS(XUL_NS, 'vbox');
    boxParent.appendChild(newVbox);
    return newVbox;
  },

  createHbox: function(boxParent)
  {
    var newHbox = document.createElementNS(XUL_NS, 'hbox');
    boxParent.appendChild(newHbox);
    return newHbox;
  },

  createBtn: function(btnParent, cb)
  {
    var newBtn = document.createElementNS(XUL_NS, 'button');
    btnParent.appendChild(newBtn);
    newBtn.addEventListener('click', cb, false);
    newBtn.classList.add('extUI');
    newBtn.classList.add('buttonUI');
    newBtn.classList.add('sBtn');
    newBtn.width = '10px';
    return newBtn;
  },

  setWindowAlpha: function(alpha)
  {
    this.symInputBoxAlpha = alpha;
    if(this.mainDiv)
    {
      if(this.symInputBoxAlpha == 0)// no alpha
        this.mainDiv.style.opacity = '1';
      else
        this.mainDiv.style.opacity = '0.' + (100-this.symInputBoxAlpha);
    }
  },

  displayWindow: function()
  {
    if(!this.init) {
      this.initWindow();
      this.init = true;
    } else {
      this.mainDiv.style.display = 'block';
    }
    this.bbscore.prefs.updateOverlayPrefs([{key:'screenKeyboardOpened', value:true}]);
  },

  closeWindow: function()
  {
    this.bbscore.prefs.updateOverlayPrefs([{key:'screenKeyboardOpened', value:false}]);
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
      var BBSWin = document.getElementById('BBSWindow');
      var mainDiv = document.createElementNS(XUL_NS, 'div');
      BBSWin.appendChild(mainDiv);
      mainDiv.classList.add('extUI');
      mainDiv.classList.add('dragUI');
      mainDiv.classList.add('drag');
      mainDiv.classList.add('symbolInput');
      mainDiv.style.left = '10px';
      mainDiv.style.top = '10px';
      if(this.symInputBoxAlpha == 0)// no alpha
        mainDiv.style.opacity = '1';
      else
        mainDiv.style.opacity = '0.' + (100-this.symInputBoxAlpha);
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

      // XUL <menulist> not working in E10S (Firefox bug ?)
      // Modify: Use html tag <select>
      var pageSelect;
      if(this.bbscore.prefs.overlayPrefs.remoteBrowser) {
        pageSelect = document.createElement('select');
        box3.appendChild(pageSelect);
        pageSelect.style.fontSize='12px';
        pageSelect.style.margin='4px 2px';
        pageSelect.setAttribute('editable','false');
        pageSelect.classList.add('extUI');
        pageSelect.classList.add('buttonUI');
        pageSelect.classList.add('WinBtn');
        pageSelect.setAttribute('id','sympageselect');
        pageSelect.setAttribute('sizetopopup','always');

        for(var i=0;i<this.symbolPageCount;++i)
        {
          var str = this.bbscore.getLM('symbolList'+i);
          var option = document.createElement('option');
          option.text = str;
          option.value = i;
          option.classList.add('extUI');
          pageSelect.appendChild(option);
        }
        pageSelect.selectedIndex = 0;
        this.pageSelect = pageSelect;
        pageSelect.addEventListener('change', this.selectitem.bind(this), false);
      } else {
        pageSelect = document.createElementNS(XUL_NS, 'menulist');
        box3.appendChild(pageSelect);
        pageSelect.style.fontSize='12px';
        pageSelect.setAttribute('editable','false');
        pageSelect.classList.add('extUI');
        pageSelect.classList.add('buttonUI');
        pageSelect.classList.add('WinBtn');
        pageSelect.setAttribute('id','sympageselect');
        pageSelect.setAttribute('sizetopopup','always');

        for(var i=0;i<this.symbolPageCount;++i)
        {
          var str = this.bbscore.getLM('symbolList'+i);
          pageSelect.appendItem(str, i);
        }
        pageSelect.selectedIndex = 0;
        this.pageSelect = pageSelect;
        pageSelect.addEventListener('command', this.selectitem.bind(this), false);
      }

      var clientDiv = document.createElementNS(XUL_NS, 'div');
      box1.appendChild(clientDiv);

      this.buttonDiv = this.createPageDiv(clientDiv, 'buttonDiv', true);
      var vbox = this.createVbox(this.buttonDiv);
      var hbox;
      var btnCb = this.btnSymClick.bind(this);
      for(var i=0;i<71;++i)
      {
        if(i%10==0)
        {
          hbox = this.createHbox(vbox);
          hbox.classList.add('extUI');
          hbox.classList.add('dragUI');
          hbox.classList.add('nonspan');
        }
        var newbtn = this.createBtn(hbox, btnCb);
        this.btns.push(newbtn);
        if(i<this.symbles[0].length)
          newbtn.label = this.symbles[0][i];
        else
        {
          newbtn.label = '';
          newbtn.hidden = true;
        }
      }
  }
};
