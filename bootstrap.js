/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { utils: Cu, classes: Cc, interfaces: Ci } = Components;
const rootURI = __SCRIPT_URI_SPEC__.replace("bootstrap.js", "");
const COMMONJS_URI = "resource://gre/modules/commonjs";
const { require } = Cu.import(COMMONJS_URI + "/toolkit/require.js", {});
const { Bootstrap } = require(COMMONJS_URI + "/sdk/addon/bootstrap.js");
var { startup: startupBS, shutdown: shutdownBS, install, uninstall } = new Bootstrap(rootURI);
var enable = false;
var addonBaseUrl = null;

function unload() {
  //unload frame-script, unregister telnet protocol handler
  let globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageBroadcaster);
  globalMM.removeDelayedFrameScript(addonBaseUrl + "data/js/frame-script.js");
  globalMM.removeMessageListener("bbsfox@ettoolong:bbsfox-globalCommand", exec);
}

function exec(msg) {
  switch(msg.data.name) {
    case "addonBaseUrl":
      return addonBaseUrl;
    case "unload":
      if(enable) {
        enable = false;
        return unload();
      }
    default:
  }
}

//reference: https://github.com/mozilla/pdf.js/blob/master/extensions/firefox/bootstrap.js
function startup(aData, aReason) {
  addonBaseUrl = aData.resourceURI.spec;
  enable = true;
  startupBS(aData, aReason);
  //load frame-script, register telnet protocol handler
  let globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIFrameScriptLoader);
  globalMM.addMessageListener("bbsfox@ettoolong:bbsfox-globalCommand", exec);
  globalMM.loadFrameScript(addonBaseUrl + "data/js/frame-script.js", true);
  globalMM.broadcastAsyncMessage("bbsfox@ettoolong:bbsfox-globalCommand", {name:"load"});
}

function shutdown(aData, aReason) {
  shutdownBS(aData, aReason);
  if (aReason == APP_SHUTDOWN)
    return;
  let globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageBroadcaster);
  // send message. it's time to unload frame-script.
  globalMM.broadcastAsyncMessage("bbsfox@ettoolong:bbsfox-globalCommand", {name:"unload"});
}
