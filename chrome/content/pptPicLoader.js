function BBSPPTPicLoader(listener) {
  this.bbscore = listener;
  this.dp = new DOMParser();
}

BBSPPTPicLoader.prototype={
  lastUrl: '',
  lastSuccessUrl: '',
  lastSuccessPic: '',
  PPTRegEx: /^(http:\/\/ppt\.cc\/).{4,6}$/i,
  codeBlockList: [],
  codeQueue: [],
  codePicture: [],
  maxBlock: 150,
  maxPicture: 100,
  pptUrl: 'http://ppt.cc/',
  pptUrlLength: 14,

  show: function(url, owner, cb){
    if(this.PPTRegEx.test(url))
    {
      var _this = this;
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {_this.onPageResponse(this);};
      xmlhttp.open("GET",url,true);
      xmlhttp.UniUrl = url;
      xmlhttp.LoaderAction = 'show';
      xmlhttp.owner = owner;
      xmlhttp.cb = cb;
      xmlhttp.send(null);
      return true;
    }
    return false;
  },

  load: function(url){
    //step 1: test url, must be http://ppt.cc/
    //step 2: try to fetch web page.
    //step 3: check if it include 'plurkimg', get it's value. (http://ppt.cc/gFtO@.jpg)
    //step 4: set picture url to real image url (http://ppt.cc/gFtO@.jpg)
    //step 5: keep this result to reuse.
    if(this.bbscore && this.PPTRegEx.test(url))
    {
      //we need block some url at here!
      //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
      //consoleService.logStringMessage("BBSFox: B=" + this.codeBlockList.length + ", Q=" + this.codeQueue.length + ", P =" + this.codePicture.length);
      var shortCode = url.substr(this.pptUrlLength);
      this.bbscore.setPicLocation(this.bbscore.view.tempPicX, this.bbscore.view.tempPicY);
      if(this.lastSuccessUrl==url)
      {
        this.bbscore.showPicPreview(this.lastSuccessUrl, this.lastSuccessPic);
          return true;
      }
      for(var i in this.codeBlockList)
      {
        if(this.codeBlockList[i] == shortCode)
          return false;
      }
      for(var i in this.codeQueue)
      {
        if(this.codeQueue[i] == shortCode)
          return false;
      }
      for(var i in this.codePicture)
      {
        if(this.codePicture[i].url == shortCode)
        {
          this.bbscore.showPicPreview(this.pptUrl + this.codePicture[i].url, this.pptUrl + this.codePicture[i].pic);
          return true;
        }
      }
      if(this.lastUrl!=url)
      {
        this.codeQueue.push(shortCode);
        this.lastUrl = url;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {bbsfox.pptPicLoader.onPageResponse(this);};
        xmlhttp.open("GET",url,true);
        xmlhttp.channel.QueryInterface(Components.interfaces.nsIHttpChannel).redirectionLimit = 0;
        xmlhttp.UniUrl = url;
        xmlhttp.LoaderAction = 'load';
        xmlhttp.owner = this.bbscore;
        xmlhttp.send(null);
      }
      return true;
    }
    return false;
  },

  onPageResponse: function(xmlhttp) {
    try
    {
      if(xmlhttp.readyState ==4)
      {
        var shortCode = xmlhttp.UniUrl.substr(this.pptUrlLength);
        if(xmlhttp.LoaderAction=='load')
          this.removeFromQueue(shortCode);
        if(xmlhttp.status == 200)
        {
          //var doc = this.dp.parseFromString(xmlhttp.responseText, "text/html");
          var doc = this.HTMLParser(xmlhttp.responseText);
          var plurkimg = null;
          var inputs = doc.getElementsByTagName('input');
          for(var i=0;i<inputs.length;++i)
          {
            if(inputs[i].getAttribute('id')=='plurkimg')
            {
              plurkimg = inputs[i];
              break;
            }
          }
          if(plurkimg)
          {
            //alert(xmlhttp.UniUrl);
            if(xmlhttp.LoaderAction=='load')
            {
              var picCode = plurkimg.value.substr(this.pptUrlLength);
              this.codePicture.push({url: shortCode, pic: picCode});
              if(this.codePicture.length>this.maxPicture)
                this.codePicture.shift();
              if(xmlhttp.UniUrl == this.lastUrl)
              {
                this.lastSuccessUrl = xmlhttp.UniUrl;
                this.lastSuccessPic = plurkimg.value;
                this.bbscore.showPicPreview(this.lastSuccessUrl, this.lastSuccessPic);
              }
            }
            else if(xmlhttp.LoaderAction=='show')
            {
              //xmlhttp.owner.setPictureUrl(plurkimg.value);
              xmlhttp.cb(xmlhttp.owner, plurkimg.value);
            }
          }
          else
          {
            this.codeBlockList.push(shortCode);
            if(this.codeBlockList.length>this.maxBlock)
              this.codeBlockList.shift();
          }
        }
        else
        {
          this.codeBlockList.push(shortCode);
          if(this.codeBlockList.length>this.maxBlock)
            this.codeBlockList.shift();
        }
      }
    }
    catch(e)
    {
      //alert('err');
    }
  },

  removeFromQueue: function (code){

    var temp = [];
    while(this.codeQueue.length){
      var u = this.codeQueue.shift();
      if(u != code)
        temp.push(u);
    }
    while(temp.length){
      this.codeQueue.push(temp.shift());
    }
  },

  //https://developer.mozilla.org/en-US/Add-ons/Code_snippets/HTML_to_DOM
  HTMLParser: function (aHTMLString){
    var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    html.documentElement.appendChild(body);
    body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML).parseFragment(aHTMLString, false, null, body));
    return body;
  }
};
