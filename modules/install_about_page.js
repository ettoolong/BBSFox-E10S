var EXPORTED_SYMBOLS = ["BBSFoxAboutPage"];

function BBSFoxAboutPage() {}

BBSFoxAboutPage.prototype = {
  classDescription: "About BBSFox Page",
  classID: Components.ID("{be8771f0-2dbb-11e5-a2cb-0800200c9a66}"),
  contractID: "@mozilla.org/network/protocol/about;1?what=bbsfox",
  QueryInterface: function QueryInterface(iid){
    if (iid.equals(Components.interfaces.nsIAboutModule))
      return this;
    else
      throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  newChannel: function(aURI) {
    if (! (aURI.spec == 'about:bbsfox') )
      return;

    var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var channel =  ios.newChannel('chrome://bbsfox/content/options.xul', null, null);
    channel.originalURI = aURI;
      return channel;
  },

  getURIFlags: function(aURI) {
    return Components.interfaces.nsIAboutModule.ALLOW_SCRIPT;
  }
};
