//fire event from bbsfox overlay
const { utils: Cu, classes: Cc, interfaces: Ci, manager: Cm, results: Cr } = Components;

let enabled = true;
function handleOverlayCommand(message) {
  if(!enabled) return;
  if(content) {
    let bbscore = content.bbsfox;
    if(bbscore) {
      bbscore.overlaycmd.exec(message.data);
    }
  }
}

function handleAddonCommand(message) {
  if(!enabled) return;
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

function handleOverlayEvent(message) {
  if(!enabled) return;
  if(message.data.command === "update") {
    if(content) {
      let bbscore = content.bbsfox;
      if(bbscore) {
        bbscore.updateTabInfo();
      }
    }
  }
}

function frameScript(message, async){
  if(message.command === "disableScript") {
    enabled = false;
    removeEventListener("bbsfox@ettoolong:bbsfox-overlayCommand", handleOverlayCommand, false);
    removeEventListener("bbsfox@ettoolong:bbsfox-addonCommand", handleAddonCommand, false);
    removeEventListener("bbsfox@ettoolong:bbsfox-overlayEvent", handleOverlayEvent, false);
  } else {
    if(!async)
      return sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", message);
    else
      return sendAsyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", message);
  }
}

addMessageListener("bbsfox@ettoolong:bbsfox-overlayCommand", handleOverlayCommand, false);
addMessageListener("bbsfox@ettoolong:bbsfox-addonCommand", handleAddonCommand, false);

let init = function() {
  if(content) {
    let bbscore = content.bbsfox;
    if(bbscore) {
      //console.log("bbsfox_frame_script: sendSyncMessage frameScriptReady");
      sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command: "frameScriptReady"});
      bbscore.setFrameScript(frameScript, true);
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
addMessageListener("bbsfox@ettoolong:bbsfox-overlayEvent", handleOverlayEvent, false);

addEventListener("DOMContentLoaded", function(event) {
  //console.log("DOMContentLoaded: " + content.document.location);
  let doc = event.originalTarget;
  if(event.originalTarget.nodeName == "#document"){
    let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    Cc["@mozilla.org/timer;1"]
    .createInstance(Ci.nsITimer)
    .initWithCallback({ notify: init },10,Ci.nsITimer.TYPE_ONE_SHOT);
  }
}, false);

if(content) {
  let bbscore = content.bbsfox;
  if(bbscore) {
    bbscore.setFrameScript(frameScript, false);
  }
}