Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

function BBSFoxAboutHandler() {
}

BBSFoxAboutHandler.prototype = {
	newChannel: function(aURI) {
		if (! (aURI.spec == 'about:bbsfox') )
			return;

		var channel = Services.io.newChannel('chrome://bbsfox/content/options.xul', null, null);
		channel.originalURI = aURI;
		return channel;
	},

	getURIFlags: function(aURI) {
		return Components.interfaces.nsIAboutModule.ALLOW_SCRIPT;
	},
	classDescription: 'About BBSFox Page',
	classID: Components.ID('be8771f0-2dbb-11e5-a2cb-0800200c9a66'),
	contractID: '@mozilla.org/network/protocol/about;1?what=bbsfox',
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAboutModule])
};

try {
  let NSGetFactory = XPCOMUtils.generateNSGetFactory([BBSFoxAboutHandler]);
}
catch (ex) {
}