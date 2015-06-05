var EXPORTED_SYMBOLS = ["BBSImgurPicLoader"];

function BBSImgurPicLoader(listener, dp, xhr, htmlParser) {
  this.listener = listener;
  this.dp = dp;//new DOMParser();
  this.Xhr = xhr;
  this.htmlParser = htmlParser;
}

BBSImgurPicLoader.prototype={
  lastUrl: '',
  lastSuccessUrl: '',
  lastSuccessPic: '',
  regEx: /^(https?:\/\/(m\.)?imgur\.com\/)(\w{5,8})(\?tags)?/i,
  codeBlockList: [],
  codeQueue: [],
  codePicture: [],
  maxBlock: 150,
  maxPicture: 100,
  //imgurUrl: 'http://imgur.com/',

  show: function(url, owner, xmlhttp){
    if(this.regEx.test(url))
    {
      if(!xmlhttp)
        xmlhttp = new this.Xhr(false, {UniUrl: url, LoaderAction: "show", owner: owner}, this.onPageResponse.bind(this));
      xmlhttp.open(url);
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
    if(this.listener && this.regEx.test(url))
    {
      //we need block some url at here!
      //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
      //consoleService.logStringMessage("BBSFox: B=" + this.codeBlockList.length + ", Q=" + this.codeQueue.length + ", P =" + this.codePicture.length);
      var strArr = url.split(this.regEx);
      if(strArr.length<4)
        return false;
      //var shortCode = strArr[3];

      this.listener.cb_locate();
      if(this.lastSuccessUrl==url)
      {
        this.listener.cb_load(this.lastSuccessUrl, this.lastSuccessPic);
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
          this.listener.cb_load(this.codePicture[i].url, this.codePicture[i].pic);
          return true;
        }
      }
      if(this.lastUrl!=url)
      {
        this.codeQueue.push(url);
        this.lastUrl = url;
        var xmlhttp = new this.Xhr(false, {UniUrl: url, LoaderAction: "load", owner: null}, this.onPageResponse.bind(this));
        xmlhttp.open(url);
      }
      return true;
    }
    return false;
  },

  onPageResponse: function(info) {
    var strArr = info.UniUrl.split(this.regEx);
    var shortCode = strArr[3];
    if(info.LoaderAction=='load') {
      this.removeFromQueue(info.UniUrl);
    }
    if(info.status == 200)
    {
      var doc = this.htmlParser(info.responseText);
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
        if(info.LoaderAction=='load')
        {
          var picCode = 'http:' + mainimg.src;
          this.codePicture.push({url: info.UniUrl, pic: picCode});
          if(this.codePicture.length>this.maxPicture)
            this.codePicture.shift();
          if(info.UniUrl == this.lastUrl)
          {
            this.lastSuccessUrl = info.UniUrl;
            this.lastSuccessPic = picCode;
            this.listener.cb_load(this.lastSuccessUrl, this.lastSuccessPic);
          }
        }
        else if(info.LoaderAction=='show')
        {
          this.listener.cb_show(info.owner, 'http:' + mainimg.src);
        }
      }
      else
      {
        this.codeBlockList.push(info.UniUrl);
        if(this.codeBlockList.length>this.maxBlock)
          this.codeBlockList.shift();
      }
    }
    else
    {
      this.codeBlockList.push(info.UniUrl);
      if(this.codeBlockList.length>this.maxBlock)
        this.codeBlockList.shift();
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
  }
};
