function PictureViewer(bbscore) {
  this.bbscore = bbscore;
  this.CmdHandler = document.getElementById("cmdHandler");
  //this.opt = new Array(8);

  let BBSWin = document.getElementById("BBSWindow");
  let viewerDiv = document.createElementNS(XUL_NS, "div");
  BBSWin.appendChild(viewerDiv);
  viewerDiv.classList.add("extUI", "dragUI", "drag", "picViewer");
  viewerDiv.style.left = "10px";
  viewerDiv.style.top = "10px";
  viewerDiv.addEventListener("mousedown", event => { this.mousedown(event); }, false);
  viewerDiv.addEventListener("mouseup", event => { this.mouseup(event); } , false);

  let box1 = document.createElementNS(XUL_NS, "vbox");
  viewerDiv.appendChild(box1);

  let box2 = document.createElementNS(XUL_NS, "hbox");
  box1.appendChild(box2);
  box2.classList.add("extUI", "dragUI", "nonspan");

  let spacer1 = document.createElementNS(XUL_NS, "spacer");
  box2.appendChild(spacer1);
  spacer1.setAttribute("flex", "1");
  spacer1.classList.add("extUI", "dragUI", "nonspan");

  let closeBtn = document.createElementNS(XUL_NS, 'image');
  box2.appendChild(closeBtn);
  closeBtn.setAttribute("width", "14px");
  closeBtn.setAttribute("height", "14px");
  closeBtn.classList.add("extUI", "buttonUI", "closeWindowBtn");
  closeBtn.onclick = e => {
    if(e.button==0) {
      bbsfox.picViewerMgr.closePictureViewer(this);
    }
    else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  let clientDiv = document.createElementNS(XUL_NS, "div");
  box1.appendChild(clientDiv);
  let picDiv = document.createElement("div");
  box1.appendChild(picDiv);
  picDiv.style.display = "none";

  let loadingDiv = document.createElement("div");
  box1.appendChild(loadingDiv);

  let loadingImage = document.createElement("img");
  loadingDiv.appendChild(loadingImage);
  loadingImage.setAttribute("src", ICON_CONNECTING);
  loadingDiv.style.display = "block";

  picDiv.classList.add("extUI", "dragUI", "floatWindowClientArea5");
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
    if(event.target.classList.contains("buttonUI"))
       return;

    this.offX = event.pageX;
    this.offY = event.pageY;
    let maxzindex;

    if(event.button==0) {//left button
      //this.dragapproved = true;
      maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
      ++maxzindex;

      this.viewerDiv.style.zIndex = maxzindex;
      this.tempCurX = parseFloat(this.viewerDiv.style.left);
      this.tempCurY = parseFloat(this.viewerDiv.style.top);
      //this.CmdHandler.setAttribute("DragingWindow", '1');

      this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
      if(event.target.classList.contains("dragUI")) {
        bbsfox.picViewerMgr.dragingWindow = this;
      }
      event.preventDefault();
      return;
    }
    else if(event.button==2) {//right button
      if(event.target.classList.contains("picturePreview")) {
        //switch this window to front
        maxzindex = this.CmdHandler.getAttribute("MaxZIndex");
        ++maxzindex;

        this.viewerDiv.style.zIndex = maxzindex;
        this.tempCurX = parseFloat(this.viewerDiv.style.left);
        this.tempCurY = parseFloat(this.viewerDiv.style.top);
        //this.CmdHandler.setAttribute("DragingWindow", '1');

        this.CmdHandler.setAttribute("MaxZIndex", maxzindex);
        this.bbscore.prefs.status.mouseOnPicWindow = true;
      }
    }
  },

  mouseup: function(event) {
    this.CmdHandler.setAttribute("DragingWindow", "0");
    bbsfox.picViewerMgr.dragingWindow = null;
  },

  openViewerWindow: function(purl) {
    let image = document.createElement("img");
    this.picDiv.appendChild(image);
    image.classList.add("extUI", "dragUI", "picturePreview");

    image.onload = () => {
      bbsfox.picViewerMgr.prePicResize(image);
    };
    image.onerror = () => {
      bbsfox.picViewerMgr.picLoaderror(this);
    };
    image.setAttribute("src", purl);
  }
};

function PicViewerMgr(bbscore, extPicLoader) {
  this.bbscore = bbscore;
  this.BBSWin = document.getElementById("BBSWindow");
  this.dragingWindow = null;
  this.pviewers=[];
  this.previewCount = 0;
  //this.pptPicLoader = pptPicLoader;
  //this.imgurPicLoader = imgurPicLoader;
  this.extPicLoader = extPicLoader;
  this.extPicLoader.setCallback("show", this.setPictureUrl.bind(this) );
}

PicViewerMgr.prototype={

  openPicture: function(aurl) {
    if(aurl=='')
      return;

    if(this.extPicLoader && this.extPicLoader.show(aurl, this))
      return;

    //if(this.imgurPicLoader && this.imgurPicLoader.show(aurl, this, this.setPictureUrl))
    //  return;
    let pictureRegEx = /(?:(?:\.(?:(?:bmp|gif|jpe?g|png)(?:\?[^\/]*)?)$)|(?:https?:\/\/pbs.twimg.com\/media\/[a-zA-Z0-9_]{15,15}\.(?:(?:bmp|gif|jpe?g|png)(?::[^\/]*)?)$))/i;
    if(aurl.search(pictureRegEx) == -1)
      return;

    if(aurl.toLowerCase().indexOf("http://photo.xuite.net/")<0 &&
       aurl.toLowerCase().indexOf("http://simplest-image-hosting.net/")<0 &&
       aurl.toLowerCase().indexOf("http://screensnapr.com/")<0 &&
       aurl.toLowerCase().indexOf("https://www.dropbox.com")<0) {
      this.setPictureUrl(this, aurl);
    }
  },

  setPictureUrl: function(owner, aurl) {
    let pictureViewer = new PictureViewer(this.bbscore);
    this.pviewers.push(pictureViewer);

    pictureViewer.viewerDiv.display = "none";
    pictureViewer.viewerDiv.style.left = 10 + this.previewCount*10 + "px";
    pictureViewer.viewerDiv.style.top = 10 + this.previewCount*10 + "px";
    pictureViewer.viewerDiv.style.display = "block";
    pictureViewer.openViewerWindow(aurl);
    this.previewCount=this.previewCount+1;
    if(this.previewCount>10)
      this.previewCount = 0;
  },

  prePicResize: function(img) {
    for(let pviewer of this.pviewers) {
      if(pviewer.picDiv == img.parentNode) {
        pviewer.loadingDiv.style.display = "none";
        pviewer.picDiv.style.display = "block";
        let imgWidth = parseFloat(document.defaultView.getComputedStyle(img, null).width);
        let imgHeight = parseFloat(document.defaultView.getComputedStyle(img, null).height);
        let scale = imgHeight / 150;
        if(scale > 1) {
          img.style.width = imgWidth / scale + "px";
          img.style.height = imgHeight / scale + "px";
        }
        break;
      }
    }
  },

  picLoaderror: function(target) {
    for(let pviewer of this.pviewers) {
      if(pviewer === target) {
        let errImage = document.createElement("img");
        this.removeAllChild(pviewer.loadingDiv);
        pviewer.loadingDiv.appendChild(errImage);
        errImage.setAttribute("src", ICON_ERROR);
        break;
      }
    }
  },

  removeAllChild: function(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
  },

  closePictureViewer: function(target) {
    this.pviewers = this.pviewers.filter( pviewer => {
      if(pviewer === target) {
        this.BBSWin.removeChild(pviewer.viewerDiv );
        return false;
      } else {
        return true;
      }
    });
  },

  closeAllPictureViewer: function() {
    for(let pviewer of this.pviewers)
      this.BBSWin.removeChild(pviewer.viewerDiv );
    this.pviewers.length = 0;
  }
};
