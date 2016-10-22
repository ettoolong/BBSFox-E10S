// Browser utilities, including preferences API access, site-depedent setting through Places API

// From https://developer.mozilla.org/en/Code_snippets/Preferences
function BBSFoxPrefListener(rootName, branchName, func, prefsHandler) {
  var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
  var branch = prefService.getBranch(branchName);
  var rootBranch = prefService.getBranch(rootName);

  if(prefsHandler) {
    prefsHandler.branchName = branchName;
  }
  branch.QueryInterface(Ci.nsIPrefBranch);
  rootBranch.QueryInterface(Ci.nsIPrefBranch);

  this.register = function() {
    branch.addObserver("", this.branchObserve, false);
    branch.getChildList("", { })
          .forEach(function (name) { func(branch, name); });

    rootBranch.addObserver("DynamicRenderTest", this.rootObserve, false);
    rootBranch.getChildList("", { })
          .forEach(function (name) { func(rootBranch, name); });
  };
  this.unregister = function unregister() {
    if (branch)
      branch.removeObserver("", this.branchObserve);

    if (rootBranch)
      rootBranch.removeObserver("DynamicRenderTest", this.rootObserve, false);
  };
  this.branchObserve = {
    observe:function(subject, topic, data) {
      if (topic == "nsPref:changed")
        func(branch, data);
    },
  };
  this.rootObserve ={
    observe:function(subject, topic, data) {
      if (topic == "nsPref:changed")
        func(rootBranch, data);
    }
  };
}

function BBSFoxBrowserUtils() {
  // XXX: UNUSED AND UNTESTED
  this.__defineGetter__('_prefBranch', function() {
    delete this['_prefBranch'];
    return this['_prefBranch'] = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService)
                                                                          .getBranch('extensions.bbsfox2.');
  });
  //this.__defineGetter__('_bookmarkService', function() {
  //  delete this['_bookmarkService'];
  //  return this['_bookmarkService'] = Cc['@mozilla.org/browser/nav-bookmarks-service;1'].getService(Ci.nsINavBookmarksService);
  //});
  this.__defineGetter__('_ioService', function() {
    delete this['_ioService'];
    return this['_ioService'] = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
  });
  //this.bookmarkID = null;
  this.isDefaultPref = true;
  this.siteAuthInfo = '';
  this.siteAddr = null;
}

BBSFoxBrowserUtils.prototype = {

  findSiteTitle: function(url, port) {
    var url2 = url+":"+port;
    var siteIDs = this.getSubBranch('hostlist_').getChildList("", { });
    var CiStr = Ci.nsISupportsString;
    //var availableIDs = new Array();
    for(var i=0; i<siteIDs.length; ++i) {
    	var urlToken = siteIDs[i].split(":");
    	if(urlToken.length == 2) {
        if(urlToken[0] == url && urlToken[1] == port)//have site setting, return site name
        {
          this.siteAddr = siteIDs[i];
          this.siteAuthInfo = url2;
          this.isDefaultPref = false;
          return this.getSubBranch('host_' + siteIDs[i]+'.').getComplexValue('sitename', CiStr).data;
        }
      }
    }
    for(var i=0; i<siteIDs.length; ++i) {
    	var urlToken = siteIDs[i].split(":");
    	if(urlToken.length == 1) {
        if(urlToken[0] == url)//have site setting, return site name
        {
          this.siteAddr = siteIDs[i];
          this.siteAuthInfo = url + ':' + '23';
          this.isDefaultPref = false;
          return this.getSubBranch('host_' + siteIDs[i]+'.').getComplexValue('sitename', CiStr).data;
        }
    	}
    }
    this.siteAddr = 'default';
    this.isDefaultPref = true;
    return url; //can't find site setting, return host name.
  },

  prefListener: function(func, prefsHandler) {
    var listener = new BBSFoxPrefListener(this._prefBranch.root, this._prefBranch.root + 'host_' + this.siteAddr + '.', func, prefsHandler);
    listener.register();
    return listener;
  },

  getSubBranch: function(subBranch) {
    return Cc["@mozilla.org/preferences-service;1"]
             .getService(Ci.nsIPrefService)
             .getBranch(this._prefBranch.root + subBranch);
  },

  getSiteAddrList: function() {
    return this.getSubBranch('hostlist_').getChildList("", { });
  },

  addSite: function(siteName, siteAddr) {
      try {
        this._prefBranch.getBoolPref('hostlist_' + siteAddr);
        // site pref has been created if it throws no exception
      } catch (e) {
        // mark for creatng new site pref
        this._prefBranch.setBoolPref('hostlist_' + siteAddr, false);
      }
      var nsIString = Cc["@mozilla.org/supports-string;1"]
                      .createInstance(Ci.nsISupportsString);
      nsIString.data = siteName;
      this._prefBranch.setComplexValue('host_' + siteAddr + '.sitename', Ci.nsISupportsString, nsIString);
  },

  saveSite: function(siteName, siteAddr) {
      this._prefBranch.setBoolPref('hostlist_' + siteAddr, true);
      var nsIString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
      nsIString.data = siteName;
      this._prefBranch.setComplexValue('host_' + siteAddr + '.sitename', Ci.nsISupportsString, nsIString);
  },

  deleteSitePref: function(url) {
    this.getSubBranch('hostlist_' + url).deleteBranch("");
    this.getSubBranch('host_' + url + '.').deleteBranch("");
    //if image data in pref, delete it!
    var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    dstfile.append("_bg."+url);
    try{
      if(dstfile.exists())
        dstfile.remove(true);
    }
    catch(e){
    }
  }
};
