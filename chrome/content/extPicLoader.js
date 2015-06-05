function BBSFoxHttpReq(redirection, info, callback) {
  this.info = info;
  this.callback = callback;
  this.xmlhttp = new XMLHttpRequest();
  this.redirection = redirection;
}

BBSFoxHttpReq.prototype={
  open: function(url){
    var _this = this;
    this.xmlhttp.onreadystatechange = function() {_this.onPageResponse(this);};
    this.xmlhttp.open("GET",url,true);
    if(!this.redirection)
      this.xmlhttp.channel.QueryInterface(Components.interfaces.nsIHttpChannel).redirectionLimit = 0;
    this.xmlhttp.send(null);
  },
  onPageResponse: function(xmlhttp) {
    try
    {
      if(xmlhttp.readyState ==4)
      {
        this.info.status = xmlhttp.status;
        this.info.responseText = xmlhttp.responseText;
        this.callback(this.info);
      }
    }
    catch(e)
    {
      //alert('err');
    }
  }
};

function ExtPicLoader(listener) {
  this.bbscore = listener;
  Components.utils.import("resource://bbsfox/picLoader_ppt.js");
  Components.utils.import("resource://bbsfox/picLoader_imgur.js");
  this.dp = new DOMParser();

  //https://developer.mozilla.org/en-US/Add-ons/Code_snippets/HTML_to_DOM
  var htmlParser = function (aHTMLString){
    var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    html.documentElement.appendChild(body);
    body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML).parseFragment(aHTMLString, false, null, body));
    return body;
  };
  this.pptPicLoader = new BBSPPTPicLoader(this, this.dp, BBSFoxHttpReq, htmlParser);
  this.imgurPicLoader = new BBSImgurPicLoader(this, this.dp, BBSFoxHttpReq, htmlParser);
}

ExtPicLoader.prototype={
  setCallback: function(action, cb){
    if(action == "load")
      this.loadCB = cb;
    else if(action == "show")
      this.showCB = cb;
    else if(action == "locate")
      this.locateCB = cb;
  },

  show: function(url, owner){
    if( this.imgurPicLoader.show(url, owner) ) return true;
    if( this.pptPicLoader.show(url, owner) ) return true;
    return false;
  },

  load: function(url){
    if( this.imgurPicLoader.load(url) ) return true;
    if( this.pptPicLoader.load(url) ) return true;
    return false;
  },

  cb_locate: function(){
    this.locateCB(this.bbscore.view.tempPicX, this.bbscore.view.tempPicY);
  },

  cb_load: function(linkUrl, picUrl){
    this.loadCB(linkUrl, picUrl);
  },

  cb_show: function(owner, url){
    this.showCB(owner, url);
  }

};
