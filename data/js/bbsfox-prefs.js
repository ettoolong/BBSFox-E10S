"use strict";

const {Cu, Cc, Ci} = require("chrome");

const initDefaultPrefs = data => {
  let bbsfoxPrefs = JSON.parse(data.load("chrome://bbsfox/content/prefs.json"));
  //default site setting
  let defaultPrefs = Cc["@mozilla.org/preferences-service;1"].
                      getService(Ci.nsIPrefService).
                      getDefaultBranch("extensions.bbsfox2.");
  for(let i in bbsfoxPrefs.sitePrefs) {
    let value = bbsfoxPrefs.sitePrefs[i];
    if( typeof value === "boolean") {
      defaultPrefs.setBoolPref("host_default." + i, value);
    }
    else if( typeof value === "number") {
      defaultPrefs.setIntPref("host_default." + i, value);
    }
    else if( typeof value === "string"){
      let nsIString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
      nsIString.data = value;
      defaultPrefs.setComplexValue("host_default." + i, Ci.nsISupportsString, nsIString);
    }
  }

  //global setting
  let globalPrefs = Cc["@mozilla.org/preferences-service;1"].
               getService(Ci.nsIPrefService).
               getDefaultBranch("extensions.");

  for(let i in bbsfoxPrefs.globalPrefs) {
    let value = bbsfoxPrefs.globalPrefs[i];
    if( typeof value === "boolean") {
      globalPrefs.setBoolPref(i, value);
    }
    else if( typeof value === "number") {
      globalPrefs.setIntPref(i, value);
    }
    else if( typeof value === "string"){
      let nsIString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
      nsIString.data = value;
      globalPrefs.setComplexValue(i, Ci.nsISupportsString, nsIString);
    }
  }
}
exports.initDefaultPrefs = initDefaultPrefs;
