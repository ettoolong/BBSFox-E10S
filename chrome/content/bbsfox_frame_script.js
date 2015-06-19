//fire event from bbsfox overlay
addMessageListener("bbsfox@ettoolong:bbsfox-overlayCommand",
  function(message) {
    var bbscore = content.bbsfox;
    if(bbscore) {
      bbscore.overlaycmd.exec(message.data);
    }
  }
);

//fire event from bbsfox overlay tabAttrModified
addMessageListener("bbsfox@ettoolong:bbsfox-overlayEvent",
  function(message) {
    var bbscore;
    if(content) bbscore = content.bbsfox;
    if(bbscore) {
      var init = bbscore.setFrameScript( function(command, async){
        if(!async)
          return sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
        else
          return sendAsyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
      }.bind(this));
      if(init)
        bbscore.setSelectStatus(message.data.selected);
    } else {
      sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command:"removePrefs"});
    }
  }
);

function BBSFoxFSHttpReq(redirection, info, callback) {
  this.info = info;
  this.callback = callback;
  //this.xmlhttp = new XMLHttpRequest();
  this.redirection = redirection;
}

BBSFoxFSHttpReq.prototype={
  open: function(url){
    //1. send message to overlay.
    //2. overlay open xmlhttp and send response back.
    //3. parse the response and get real image url.
    sendAsyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command: "sendHttpRequest", url: url, info: this.info, redirection: this.redirection});
  },
  onPageResponse: function(xmlhttp, status, responseText) {
    this.info.status = status;
    this.info.responseText = responseText;
    this.callback(this.info);
  },
};
addMessageListener("bbsfox@ettoolong:bbsfox-overlayResponse",
  function(message) {
    if(content.bbsfoxEm && message.data.info && message.data.info.owner) {
      var xmlhttp = content.bbsfoxEm.xmlhttpMap['a' + message.data.info.owner];
      if(xmlhttp) {
        xmlhttp.onPageResponse(xmlhttp, message.data.info.status, message.data.info.responseText);
      }
    }
  }
);

addEventListener("DOMContentLoaded", function(event) {
  var doc = event.originalTarget;
  if (doc.nodeName != "#document" && doc.location.protocol == 'file:') return; // only documents and file
  var bbsfoxEm = doc.getElementById('bbsfox_em');
  if(bbsfoxEm) { //only process bbsfox easy-reading page.
      Components.utils.import("resource://bbsfox/picLoader_ppt.js");
      Components.utils.import("resource://bbsfox/picLoader_imgur.js");
      var dp = new content.DOMParser();
      var htmlParser = function (aHTMLString){
        var html = doc.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
        body = doc.createElementNS("http://www.w3.org/1999/xhtml", "body");
        html.documentElement.appendChild(body);
        body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML).parseFragment(aHTMLString, false, null, body));
        return body;
      };
      content.bbsfoxEm = {};
      content.bbsfoxEm.xmlhttpMap = {};
      content.bbsfoxEm.cb_show = function(nodeIdx, imageurl) {
        var anode = this.allLinks[nodeIdx];
        try{
          anode.setAttribute("emload", "1");
          var parentDiv = anode.parentNode;
          var doc = anode.ownerDocument;
          while(parentDiv.className!="BBSLine")
            parentDiv=parentDiv.parentNode;

          var node = parentDiv.nextSibling;
          var div;
          if(node.className!="AddLine")
          {
            div = doc.createElement("div");
            div.setAttribute("class","AddLine");
            parentDiv.parentNode.insertBefore(div, parentDiv.nextSibling);
          }
          else
          {
            div = node;
          }
          var br = doc.createElement("BR");
          div.appendChild(br);
          var img = doc.createElement("img");
          div.appendChild(img);
          img.setAttribute("src", imageurl);
          img.setAttribute("class", "scale");
          img.addEventListener("click", switchSize, false);
        }catch(ex)
        {}
      };
      var pptPicLoader = new BBSPPTPicLoader(content.bbsfoxEm, dp, BBSFoxFSHttpReq, htmlParser);
      var imgurPicLoader = new BBSImgurPicLoader(content.bbsfoxEm, dp, BBSFoxFSHttpReq, htmlParser);

      //
      var allLinks = doc.getElementsByTagName("a");
      content.bbsfoxEm.allLinks = allLinks;
      var PPTRegEx = /^(http:\/\/ppt\.cc\/).{4,6}$/i;
      var ImgurRegEx = /^(https?:\/\/imgur\.com\/)(\w{5,8})(\?tags)?/i;
      for(var i=0;i<allLinks.length;i++)
      {
        var url = allLinks[i].getAttribute("href");
        if(!allLinks[i].getAttribute("emload"))
        {
          if(imgurPicLoader.regEx.test(url))
          {
            var xmlhttp = new BBSFoxFSHttpReq(false, {UniUrl: url, LoaderAction: "show", owner: i}, imgurPicLoader.onPageResponse.bind(imgurPicLoader));
            content.bbsfoxEm.xmlhttpMap['a' + i] = xmlhttp;
            imgurPicLoader.show(url, i, xmlhttp);
          }
          else if(pptPicLoader.regEx.test(url))
          {
            var xmlhttp = new BBSFoxFSHttpReq(false, {UniUrl: url, LoaderAction: "show", owner: i}, pptPicLoader.onPageResponse.bind(pptPicLoader));
            content.bbsfoxEm.xmlhttpMap['a' + i] = xmlhttp;
            pptPicLoader.show(url, i, xmlhttp);
          }
        }
      }
      //
  }
});