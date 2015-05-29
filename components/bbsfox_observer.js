function bbsfoxObserver() {}

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

bbsfoxObserver.prototype = {

  dump: function dump(aMessage)
  {
    //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    //consoleService.logStringMessage("BBSFox: " + aMessage);
  },

  onAppStartup: function onAppStartup()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    this.prefBranch = prefService.getBranch("extensions.bbsfox1.");
    this.prefBranch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    this.prefBranch.addObserver("RefererRule", this, true);
    this.onChangeRefererRule(this.prefBranch);
  },

  onChangeRefererRule: function onChangeRefRule(oPrefBranch)
  {
    this.RefererRule = oPrefBranch.getBoolPref('RefererRule');
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    if(this.RefererRule)
    {
      this.dump("RefererRule ON");
      observerService.addObserver(this, "http-on-modify-request", false);
    }
    else
    {
      this.dump("RefererRule OFF");
      observerService.removeObserver(this, "http-on-modify-request", false);
    }
  },

  overridehttpreferer: function (source)
  {
    var channel = source.QueryInterface(Components.interfaces.nsIHttpChannel);
    var targetURI = channel.URI;

    //ONLY override referrer string for target http://ppt.cc/
    //example: http://ppt.cc/gFtO@.jpg -> http://ppt.cc/gFtO

    var urlStr = decodeURI(targetURI.spec);
    if(urlStr.search(/^(http:\/\/ppt\.cc\/).{4,6}@\.(bmp|gif|jpe?g|png)$/i) != -1)
    {
      var ref = urlStr.split(/@/i);
      var override = false;
      if(!targetURI.hasRef)
        override = true;
      else if(targetURI.hasRef && targetURI.ref != ref[0])
        override = true;
      if(override)
      {
        channel.setRequestHeader('Referer', ref[0], false);
        this.dump("overridehttpreferer, ref[0] = " + ref[0]);
      }
    }
  },

  // Implement nsIObserver
  observe: function observe(aSubject, aTopic, aData)
  {
    try {
      switch (aTopic)
      {
        case 'nsPref:changed':
          aSubject.QueryInterface(Components.interfaces.nsIPrefBranch);
          switch (aData)
          {
            case 'RefererRule':
              this.onChangeRefererRule(aSubject);
              break;
            default:
              break;
          }
          break;

        case 'app-startup':
        case 'profile-after-change':
          this.onAppStartup();
          break;
        case 'http-on-modify-request':
          this.overridehttpreferer(aSubject);
          break;
        default:
          break;
      }
    } catch (ex) {
    }
  },

  // Implement nsISupports
  QueryInterface: function(iid)
  {
    if (iid.equals(Components.interfaces.nsISupports) ||
      iid.equals(Components.interfaces.nsIObserver) ||
      iid.equals(Components.interfaces.nsISupportsWeakReference)) {

      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  classDescription: "BBSFox observer",
  contractID: "@mozilla.org/bbsfox;1",
  classID: Components.ID("{4B85A989-79D6-4f96-887A-BA479D3B2890}"),
  _xpcom_categories: [{category: 'profile-after-change'}]
};

try {
  Components.utils["import"]("resource://gre/modules/XPCOMUtils.jsm");

  if (XPCOMUtils.generateNSGetFactory) {
    // moz-2.0+
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([bbsfoxObserver]);
  }
  else {
    // moz-1.9
    if (!XPCOMUtils.defineLazyGetter) {
      // moz < 1.9.2; no profile-after-change category, needs service:true
      bbsfoxObserver.prototype._xpcom_categories = [{category: 'app-startup', service: true}];
    }
    function NSGetModule() { return XPCOMUtils.generateModule([bbsfoxObserver]); }
  }
}
catch (ex) {
}

Components.classes["@mozilla.org/globalmessagemanager;1"]
  .getService(Components.interfaces.nsIMessageListenerManager)
  .loadFrameScript("resource://bbsfox/global_frame_script.js", true);