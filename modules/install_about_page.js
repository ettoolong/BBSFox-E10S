var EXPORTED_SYMBOLS = ["BBSFoxAboutPage"];
//TODO: about:bbsfox  page still broken, need fix.

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

  newChannel: function(aURI, loadInfo) {
    if (! (aURI.spec == 'about:bbsfox') )
      return;

    var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    //var channel =  ios.newChannel('chrome://bbsfox/content/options.xul', null, null);
    var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);
    var aLoadingPrincipal = loadInfo.loadingPrincipal;
    var aSecurityFlags = loadInfo.securityFlags;
    var aContentPolicyType = loadInfo.contentPolicyType;
    var channel = ios.newChannel2("chrome://bbsfox/content/options.xul", //aSpec
                           null, //aOriginCharset
                           null, //aBaseURI
                           null, //aLoadingNode
                           aLoadingPrincipal, //aLoadingPrincipal
                           null, //aTriggeringPrincipal
                           aSecurityFlags, //aSecurityFlags
                           aContentPolicyType); //aContentPolicyType
    channel.originalURI = aURI;
      return channel;
  },

  getURIFlags: function(aURI) {
    return Components.interfaces.nsIAboutModule.ALLOW_SCRIPT;
  }
};
