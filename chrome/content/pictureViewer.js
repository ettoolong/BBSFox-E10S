function PictureViewer(bbscore) {
    this.bbscore = bbscore;
    this.CmdHandler = document.getElementById('cmdHandler');
    //this.opt = new Array(8);

    var BBSWin = document.getElementById('BBSWindow');
    var viewerDiv = document.createElementNS(XUL_NS, 'div');
    BBSWin.appendChild(viewerDiv);
    //playerDiv.setAttribute('align','left');
    //viewerDiv.setAttribute('class','drag');
    viewerDiv.classList.add('extUI');
    viewerDiv.classList.add('dragUI');
    viewerDiv.classList.add('drag');
    viewerDiv.classList.add('picViewer');

    viewerDiv.style.left = '10px';
    viewerDiv.style.top = '10px';

    viewerDiv.addEventListener('mousedown', this.mousedown.bind(this), false);
    viewerDiv.addEventListener('mouseup', this.mouseup.bind(this), false);

    var box1 = document.createElementNS(XUL_NS, 'vbox');
    viewerDiv.appendChild(box1);

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
    closeBtn.classList.add('closePP');
    closeBtn.onclick = function(e){
      if(e.button==0)
        bbsfox.picViewerMgr.closePictureViewer(this);
      else
      {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    var clientDiv = document.createElementNS(XUL_NS, 'div');
    box1.appendChild(clientDiv);
    var picDiv = document.createElement('div');
    box1.appendChild(picDiv);
    picDiv.style.display = 'none';

    var loadingDiv = document.createElement('div');
    box1.appendChild(loadingDiv);

    var loadingImage = document.createElement('img');
    loadingDiv.appendChild(loadingImage);
    loadingImage.setAttribute('src', 'chrome://bbsfox/skin/state_icon/connecting.gif');
    //loadingDiv.innerHTML = '<img src="chrome://bbsfox/skin/state_icon/connecting.gif"/>';
    loadingDiv.style.display = 'block';

    picDiv.classList.add('extUI');
    picDiv.classList.add('dragUI');
    picDiv.classList.add('floatWindowClientArea5');
    //
    this.box1 = box1;
    this.viewerDiv = viewerDiv;
    this.closeBtn = closeBtn;
    this.clientDiv = clientDiv;
    this.picDiv = picDiv;
    this.loadingDiv = loadingDiv;

    //this.ptype = '';
    //this.playerURL = playerURL;

    this.offX = 0;
    this.offY = 0;
    this.tempCurX = 0;
    this.tempCurY = 0;
}

PictureViewer.prototype={

  mousedown: function(event) {
    if(event.target.classList.contains('buttonUI'))
       return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    var maxzindex;

    if(event.button==0) //left button
    {
      //this.dragapproved = true;
      maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;

      this.viewerDiv.style.zIndex = maxzindex;
      this.tempCurX = parseFloat(this.viewerDiv.style.left);
      this.tempCurY = parseFloat(this.viewerDiv.style.top);
      //this.CmdHandler.setAttribute("DragingWindow", '1');

      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
      if(event.target.classList.contains('dragUI'))
      {
        bbsfox.picViewerMgr.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
    else if(event.button==2) //right button
    {
      if(event.target.classList.contains('picturePreview'))
      {
        //switch this window to front
        maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
        ++maxzindex;

        this.viewerDiv.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.viewerDiv.style.left);
        this.tempCurY = parseFloat(this.viewerDiv.style.top);
        //this.CmdHandler.setAttribute("DragingWindow", '1');

        this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
        this.prefs.updateOverlayPrefs([{key:'mouseOnPicWindow', value:true}]);
      }
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow",'0');
    bbsfox.picViewerMgr.dragingWindow = null;
  },

  openViewerWindow: function(purl) {
    var image = document.createElement('img');
    this.picDiv.appendChild(image);
    image.classList.add('extUI');
    image.classList.add('dragUI');
    image.classList.add('picturePreview');
    image.onload = function(){
      bbsfox.picViewerMgr.prePicResize(this);
    };
    image.onerror = function(){
      bbsfox.picViewerMgr.picLoaderror(this);
    };
    image.setAttribute('src',purl);
  }
};

function PicViewerMgr(pptPicLoader, imgurPicLoader) {
  this.BBSWin = document.getElementById('BBSWindow');
  this.dragingWindow = null;
  this.pviewers=[];
  this.previewCount = 0;
  this.pptPicLoader = pptPicLoader;
  this.imgurPicLoader = imgurPicLoader;
}

PicViewerMgr.prototype={

  openPicture: function(aurl) {
    if(aurl=='')
      return;

    if(this.pptPicLoader && this.pptPicLoader.show(aurl, this, this.setPictureUrl))
      return;

    if(this.imgurPicLoader && this.imgurPicLoader.show(aurl, this, this.setPictureUrl))
      return;

    if(aurl.search(/\.(bmp|gif|jpe?g|png)$/i) == -1)
      return;

    if(  aurl.toLowerCase().indexOf("http://photo.xuite.net/")<0
      && aurl.toLowerCase().indexOf("http://simplest-image-hosting.net/")<0
      && aurl.toLowerCase().indexOf("http://screensnapr.com/")<0 )
    {
      this.setPictureUrl(this, aurl);
    }
  },

  setPictureUrl: function(owner, aurl) {
    var pictureViewer = new PictureViewer();
    this.pviewers.push(pictureViewer);

    pictureViewer.viewerDiv.display = 'none';
    pictureViewer.viewerDiv.style.left = 10 + this.previewCount*10 + 'px';
    pictureViewer.viewerDiv.style.top = 10 + this.previewCount*10 + 'px';
    pictureViewer.viewerDiv.style.display = 'block';
    pictureViewer.openViewerWindow(aurl);
    this.previewCount=this.previewCount+1;
    if(this.previewCount>10)
      this.previewCount = 0;
  },

  prePicResize: function(img) {

    var findflag = false;
    var viewer = null;
    for(var i=0;i<this.pviewers.length;++i)
    {
      if(this.pviewers[i].picDiv == img.parentNode)
      {
        viewer = this.pviewers[i];
        findflag = true;
        break;
      }
    }

    if(findflag)
    {
      this.pviewers[i].loadingDiv.style.display = "none";
      this.pviewers[i].picDiv.style.display = "block";
      var imgWidth = parseFloat(document.defaultView.getComputedStyle(img, null).width);
      var imgHeight = parseFloat(document.defaultView.getComputedStyle(img, null).height);
      var scale = imgHeight / 150;
      if(scale > 1) {
          img.style.width = imgWidth / scale + "px";
          img.style.height = imgHeight / scale + "px";
      }
    }
  },

  picLoaderror: function(img) {

    var findflag = false;
    var viewer = null;
    for(var i=0;i<this.pviewers.length;++i)
    {
      if(this.pviewers[i].picDiv == img.parentNode)
      {
        viewer = this.pviewers[i];
        findflag = true;
        break;
      }
    }

    if(findflag)
    {
      var errImage = document.createElement('img');
      this.removeAllChild(viewer.loadingDiv);
      viewer.loadingDiv.appendChild(errImage);
      errImage.setAttribute('src', 'chrome://bbsfox/skin/state_icon/error.png');
      //this.pviewers[i].loadingDiv.innerHTML = '<img src="chrome://bbsfox/skin/state_icon/error.png"/>';
    }
  },

  removeAllChild: function(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
  },

  closePictureViewer: function(btn) {
    var findflag = false;
    var viewer = null;
    for(var i=0;i<this.pviewers.length;++i)
    {
      if(this.pviewers[i].closeBtn == btn)
      {
        this.BBSWin.removeChild(this.pviewers[i].viewerDiv );
        viewer = this.pviewers[i];
        findflag = true;
        break;
      }
    }

    if(findflag)
    {
      for(var i=0,n=0;i<this.pviewers.length;++i)
        if(this.pviewers[i]!=viewer)
          this.pviewers[n++] = this.pviewers[i];
      this.pviewers.length -= 1;
    }
  },

  closeAllPictureViewer: function() {
    for(var i=0;i<this.pviewers.length;++i)
      this.BBSWin.removeChild(this.pviewers[i].viewerDiv );
    this.pviewers.length = 0;
  }
};