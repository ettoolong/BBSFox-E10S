"use strict";
let {components, Cc, Ci, Cm, Cr} = require("chrome");

//reference: https://developer.mozilla.org/en-US/docs/Custom_about:_URLs

Cm.QueryInterface(Ci.nsIComponentRegistrar);

function AboutCustom() {}
AboutCustom.prototype = Object.freeze({
    classDescription: 'BBSFox Preferences',
    contractID: '@mozilla.org/network/protocol/about;1?what=bbsfox',
    classID: components.ID('{be8771f0-2dbb-11e5-a2cb-0800200c9a66}'),
    QueryInterface: function QueryInterface(iid){
      if (iid.equals(Ci.nsIAboutModule))
        return this;
      else
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    getURIFlags: function(aURI) {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    },

    newChannel: function(aURI, aSecurity_or_aLoadInfo) {
      if (! (aURI.spec === 'about:bbsfox') )
        return;

      let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      let uri = ios.newURI("chrome://bbsfox/content/options.xul", null, null);
      let channel = ios.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
      channel.originalURI = aURI;
      return channel;
    }
});

function BBSFoxAboutFactory() {
    let component = AboutCustom;
    this.createInstance = function(outer, iid) {
        if (outer) {
            throw Cr.NS_ERROR_NO_AGGREGATION;
        }
        return new component();
    };
    this.register = function() {
        Cm.registerFactory(component.prototype.classID, component.prototype.classDescription, component.prototype.contractID, this);
    };
    this.unregister = function() {
        Cm.unregisterFactory(component.prototype.classID, this);
    }
    Object.freeze(this);
    this.register();
}

exports.Page = BBSFoxAboutFactory;
