var EXPORTED_SYMBOLS = ["BBSPPTPicLoader"];

function BBSPPTPicLoader(listener, dp, xhr, htmlParser) {
  this.listener = listener;
  this.dp = dp;//new DOMParser();
  this.Xhr = xhr;
  this.htmlParser = htmlParser;
}

BBSPPTPicLoader.prototype={
  lastUrl: '',
  lastSuccessUrl: '',
  lastSuccessPic: '',
  regEx: /^http:\/\/ppt\.cc\/(.{4,6})$/i,
  codeBlockList: [],
  codeQueue: [],
  codePicture: [],
  maxBlock: 150,
  maxPicture: 100,
  pptUrl: 'http://ppt.cc/',
  pptUrlLength: 14,

  show: function(url, owner){
    if(this.regEx.test(url))
    {
      //var _this = this;
      var xmlhttp = new this.Xhr(false, {UniUrl: url, LoaderAction: "show", owner: owner}, this.onPageResponse.bind(this));
      xmlhttp.open(url);
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
    if(this.listener && this.regEx.test(url))
    {
      //we need block some url at here!
      //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
      //consoleService.logStringMessage("BBSFox: B=" + this.codeBlockList.length + ", Q=" + this.codeQueue.length + ", P =" + this.codePicture.length);
      var shortCode = url.substr(this.pptUrlLength);
      this.listener.cb_locate();
      if(this.lastSuccessUrl==url)
      {
        this.listener.cb_load(this.lastSuccessUrl, this.lastSuccessPic);
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
          this.listener.cb_load(this.pptUrl + this.codePicture[i].url, this.pptUrl + this.codePicture[i].pic);
          return true;
        }
      }
      if(this.lastUrl!=url)
      {
        this.codeQueue.push(shortCode);
        this.lastUrl = url;
        var xmlhttp = new this.Xhr(false, {UniUrl: url, LoaderAction: "load", owner: null}, this.onPageResponse.bind(this));
        xmlhttp.open(url);
      }
      return true;
    }
    return false;
  },

  onPageResponse: function(info) {
    var shortCode = info.UniUrl.substr(this.pptUrlLength);
    if(info.LoaderAction=='load') {
      this.removeFromQueue(shortCode);
    }
    if(info.status == 200)
    {
      var doc = this.htmlParser(info.responseText);
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
        if(info.LoaderAction=='load')
        {
          var picCode = plurkimg.value.substr(this.pptUrlLength);
          this.codePicture.push({url: shortCode, pic: picCode});
          if(this.codePicture.length>this.maxPicture)
            this.codePicture.shift();
          if(info.UniUrl == this.lastUrl)
          {
            this.lastSuccessUrl = info.UniUrl;
            this.lastSuccessPic = plurkimg.value;
            this.listener.cb_load(this.lastSuccessUrl, this.lastSuccessPic);
          }
        }
        else if(info.LoaderAction=='show')
        {
          this.listener.cb_show(info.owner, plurkimg.value);
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
