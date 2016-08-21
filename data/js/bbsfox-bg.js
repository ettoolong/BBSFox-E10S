"use strict";

const {Cu, Cc, Ci} = require("chrome");

const ioService = Cc["@mozilla.org/network/io-service;1"].
                  getService(Ci.nsIIOService);
const resourceHandler = ioService.getProtocolHandler("resource").
                        QueryInterface(Ci.nsIResProtocolHandler);

const mount = () => {
    Cu.import("resource://gre/modules/osfile.jsm");
    let dir = OS.Path.join(OS.Constants.Path.profileDir, 'bbsfoxBg');
    try{
      OS.File.makeDir(dir);
    } catch(ex) {
    }
    let alias = ioService.newURI( OS.Path.toFileURI( OS.Path.join(OS.Constants.Path.profileDir, 'bbsfoxBg', 'bbsfox') ), null, null);
    resourceHandler.setSubstitution('bbsfox2', alias);
    Cu.unload("resource://gre/modules/osfile.jsm");
}
const unmount = () => {
    resourceHandler.setSubstitution('bbsfox2', null);
}
exports.mount = mount;
exports.unmount = unmount;