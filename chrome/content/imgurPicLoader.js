function BBSImgurPicLoader(listener) {
  this.bbscore = listener;
  this.dp = new DOMParser();
}

BBSImgurPicLoader.prototype={
  lastUrl: '',
  lastSuccessUrl: '',
  lastSuccessPic: '',
  ImgurRegEx: /^(https?:\/\/(m\.)?imgur\.com\/)(\w{5,8})(\?tags)?/i,
  codeBlockList: [],
  codeQueue: [],
  codePicture: [],
  maxBlock: 150,
  maxPicture: 100,
  //imgurUrl: 'http://imgur.com/',

  show: function(url, owner, cb){
    if(this.ImgurRegEx.test(url))
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
    //step 1: test url, must be http://imgur.com/ or https://imgur.com/
    //step 2: try to fetch web page.
    //step 3: check if it include 'mainimg', get it's src. (//i.imgur.com/aIsFSPa.jpg)
    //step 4: set picture url to real image url (http://i.imgur.com/aIsFSPa.jpg)
    //step 5: keep this result to reuse.
    if(this.bbscore && this.ImgurRegEx.test(url))
    {
      //we need block some url at here!
      //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
      //consoleService.logStringMessage("BBSFox: B=" + this.codeBlockList.length + ", Q=" + this.codeQueue.length + ", P =" + this.codePicture.length);
      var strArr = url.split(this.ImgurRegEx);
      if(strArr.length<4)
        return false;
      //var shortCode = strArr[3];
      
      this.bbscore.setPicLocation(this.bbscore.view.tempPicX, this.bbscore.view.tempPicY);
      if(this.lastSuccessUrl==url)
      {
        this.bbscore.showPicPreview(this.lastSuccessUrl, this.lastSuccessPic);
          return true;
      }
      for(var i in this.codeBlockList)
      {
        if(this.codeBlockList[i] == url)
          return false;
      }
      for(var i in this.codeQueue)
      {
        if(this.codeQueue[i] == url)
          return false;
      }
      for(var i in this.codePicture)
      {
        if(this.codePicture[i].url == url)
        {
          this.bbscore.showPicPreview(this.codePicture[i].url, this.codePicture[i].pic);
          return true;
        }
      }
      if(this.lastUrl!=url)
      {
        this.codeQueue.push(url);
        this.lastUrl = url;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {bbsfox.imgurPicLoader.onPageResponse(this);};
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
        var strArr = xmlhttp.UniUrl.split(this.ImgurRegEx);
        var shortCode = strArr[3];
        //var shortCode = xmlhttp.UniUrl.substr(this.pptUrlLength);
        if(xmlhttp.LoaderAction=='load') {
          this.removeFromQueue(xmlhttp.UniUrl);
        }
        if(xmlhttp.status == 200)
        {
          //var doc = this.dp.parseFromString(xmlhttp.responseText, "text/html");
          var doc = this.HTMLParser(xmlhttp.responseText);
          var mainimg = null;
          var imgs = doc.getElementsByTagName('img');
          for(var i=0;i<imgs.length;++i)
          {
            if(imgs[i].getAttribute('src').indexOf(shortCode) != -1)
            {
              mainimg = imgs[i];
              break;
            }
          }
          if(mainimg)
          {
            //alert(xmlhttp.UniUrl);
            if(xmlhttp.LoaderAction=='load')
            {
              var picCode = 'http:' + mainimg.src;
              this.codePicture.push({url: xmlhttp.UniUrl, pic: picCode});
              if(this.codePicture.length>this.maxPicture)
                this.codePicture.shift();
              if(xmlhttp.UniUrl == this.lastUrl)
              {
                this.lastSuccessUrl = xmlhttp.UniUrl;
                this.lastSuccessPic = picCode;
                this.bbscore.showPicPreview(this.lastSuccessUrl, this.lastSuccessPic);
              }
            }
            else if(xmlhttp.LoaderAction=='show')
            {
              xmlhttp.cb(xmlhttp.owner, 'http:' + mainimg.src);
            }
          }
          else
          {
            this.codeBlockList.push(xmlhttp.UniUrl);
            if(this.codeBlockList.length>this.maxBlock)
              this.codeBlockList.shift();
          }
        }
        else
        {
          this.codeBlockList.push(xmlhttp.UniUrl);
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
