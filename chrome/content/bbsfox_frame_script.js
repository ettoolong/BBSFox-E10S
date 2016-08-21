//fire event from bbsfox overlay

const { utils: Cu, classes: Cc, interfaces: Ci, manager: Cm, results: Cr } = Components;
addMessageListener("bbsfox@ettoolong:bbsfox-overlayCommand",
  function(message) {
    if(content) {
      let bbscore = content.bbsfox;
      if(bbscore) {
        bbscore.overlaycmd.exec(message.data);
      }
    }
  }
);

addMessageListener("bbsfox@ettoolong:bbsfox-addonCommand",
  function(message) {
    //console.log(message.data.command);
    let doRefreshTabs = function(doc, close) {
      let loc = doc.location;
      let protocol = loc.protocol.toLowerCase();
      if (protocol == "telnet:" || protocol == "ssh:") {
        // Disconnect page.
      } else if(loc.href == "about:bbsfox"){
        content.close();
      }
    };
    if(content) {
      switch (message.data.command) {
        case "disable":
        case "uninstall":
          doRefreshTabs(content.document, true);
          break;
        case "startup":
        case "enable":
        case "install":
        case "upgrade":
        case "downgrade":
          doRefreshTabs(content.document, false);
          break;
        default:
          break;
      }
    }
  }
);

let init = function() {
  if(content) {
    let bbscore = content.bbsfox;
    if(bbscore) {
      //console.log("bbsfox_frame_script: sendSyncMessage frameScriptReady");
      sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command: "frameScriptReady"});
      bbscore.setFrameScript( function(command, async){
        if(!async)
          return sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
        else
          return sendAsyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
      }.bind(this));
      //if(init)
      //  bbscore.setSelectStatus(message.data.selected); //TODO: still need this ?
    } else if(bbscore !== null) {
      sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command:"removeStatus"});
      if(content.document.location.protocol === "telnet:" || content.document.location.protocol === "ssh:") {
        Cc["@mozilla.org/timer;1"]
        .createInstance(Ci.nsITimer)
        .initWithCallback({ notify: init },100,Ci.nsITimer.TYPE_ONE_SHOT);
      }
      //sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command:"removePrefs"}); //TODO: still need this ?
    }
  } else {
  }
};

//fire event from bbsfox overlay tabAttrModified
addMessageListener("bbsfox@ettoolong:bbsfox-overlayEvent", function(message) {
  if(message.data.command === "update") {
    if(content) {
      let bbscore = content.bbsfox;
      if(bbscore) {
        bbscore.updateTabInfo();
      }
    }
  }
});

addEventListener("DOMContentLoaded", function(event) {
  //console.log("DOMContentLoaded: " + content.document.location.protocol);
  let doc = event.originalTarget;
  if(event.originalTarget.nodeName == "#document"){
    let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    Cc["@mozilla.org/timer;1"]
    .createInstance(Ci.nsITimer)
    .initWithCallback({ notify: init },10,Ci.nsITimer.TYPE_ONE_SHOT);
  }
}, false);
