/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.
 *
 * The Initial Developer of the Original Code is IBM Corporation.
 * Portions created by IBM Corporation are Copyright (C) 2004
 * IBM Corporation. All Rights Reserved.
 *
 * Contributor(s):
 *   Darin Fisher <darin@meer.net>
 *   Doron Rosenberg <doronr@us.ibm.com>
 *   Hong Jen Yee (PCMan) <pcman.tw@gmail.com>
 *   Hsiao-Ting Yu <sst.dreams@gmail.com>
 *   Ett Chung <ettoolong@hotmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// reference: Working with multiprocess Firefox
// https://developer.mozilla.org/en-US/Add-ons/Working_with_multiprocess_Firefox

const { classes: Cc, interfaces: Ci, manager: Cm, results: Cr, ID: Cid } = Components;

const kTELNET_CONTRACTID = "@mozilla.org/network/protocol;1?name=telnet";
const kSSH_CONTRACTID = "@mozilla.org/network/protocol;1?name=ssh";

// Mozilla defined
const kSTANDARDURL_CONTRACTID = "@mozilla.org/network/standard-url;1";
const kIOSERVICE_CONTRACTID   = "@mozilla.org/network/io-service;1";
const nsIIOService       = Ci.nsIIOService;
const nsIProtocolHandler = Ci.nsIProtocolHandler;
const nsIStandardURL     = Ci.nsIStandardURL;
const nsIURI             = Ci.nsIURI;

function regAll() {
  function TelnetProtocol() {
    this.regFactory = null;
    this.wrappedJSObject = this;
  }

  TelnetProtocol.prototype = {
    classDescription: "Telnet Protocol",
    classID: Cid("5FAF83FD-708D-45c0-988B-C7404FB25376"),
    contractID: kTELNET_CONTRACTID,
    QueryInterface: function QueryInterface(iid){
      if (iid.equals(nsIProtocolHandler))
        return this;
      else
        throw Cr.NS_ERROR_NO_INTERFACE;
    },
    scheme: "telnet",
    protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                  nsIProtocolHandler.URI_NOAUTH |
                  nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

    allowPort: function(port, scheme) {
      return false
    },

    setFactory: function(factory) {
      this.regFactory = factory;
    },

    getFactory: function(factory) {
      return this.regFactory;
    },

    newURI: function(spec, charset, baseURI) {
      let cls = Cc[kSTANDARDURL_CONTRACTID];
      let url = cls.createInstance(nsIStandardURL);
      url.init(nsIStandardURL.URLTYPE_AUTHORITY, 23, spec, charset, baseURI);
      return url.QueryInterface(nsIURI);
    },

    newChannel: function(aURI, aSecurity_or_aLoadInfo) {
      // create dummy nsIURI and nsIChannel instances
      let ios = Cc[kIOSERVICE_CONTRACTID].getService(nsIIOService);
      let uri = ios.newURI("chrome://bbsfox/content/telnet.html", null, null);
      return ios.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
    }
  };

  function SshProtocol(){
    this.regFactory = null;
    this.wrappedJSObject = this;
  }

  SshProtocol.prototype =
  {
    classDescription: "SSH Protocol",
    classID: Cid("dbc42190-21eb-11e0-ac64-0800200c9a66"),
    contractID: kSSH_CONTRACTID,
    QueryInterface: function QueryInterface(iid){
      if (iid.equals(nsIProtocolHandler))
        return this;
      else
        throw Cr.NS_ERROR_NO_INTERFACE;
    },
    scheme: "ssh",
    defaultPort: 22,
    protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                  nsIProtocolHandler.URI_NOAUTH |
                  nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

    allowPort: function(port, scheme) {
      return false;
    },

    setFactory: function(factory) {
      this.regFactory = factory;
    },

    getFactory: function(factory) {
      return this.regFactory;
    },

    newURI: function(spec, charset, baseURI) {
      // for nsStandardURL test - http://groups.google.com.tw/group/pcmanfx/browse_thread/thread/ec757aa8c73b1432#
      // Parameters:
      // * aUrlType: URLTYPE_AUTHORITY will always convert ssh:, ssh:/, ssh://, ssh:/// to ssh://
      // * aDefaultPort: will convert ssh://ptt.cc:22 to ssh://ptt.cc
      let url = Cc[kSTANDARDURL_CONTRACTID].createInstance(nsIStandardURL);
      url.init(nsIStandardURL.URLTYPE_AUTHORITY, 22, spec, charset, baseURI);
      // Filter and return the pure URI
      let cleanURI = url.QueryInterface(nsIURI);
      let PttRegEx = /^(?:(?:(?:bbs\.)?ptt(?:2|3)?\.cc)|(?:ptt(?:2|3)?\.twbbs\.org))$/i;
      if(!PttRegEx.test(cleanURI.host)) //ONLY allow site ptt/ptt2/ptt3 keep username
        cleanURI.userPass = '';
      cleanURI.path = '';
      return cleanURI;
    },

    newChannel: function(aURI, aSecurity_or_aLoadInfo) {
      // create dummy nsIURI and nsIChannel instances
      let ios = Cc[kIOSERVICE_CONTRACTID].getService(nsIIOService);
      let uri = ios.newURI("chrome://bbsfox/content/ssh.html", null, null);
      return ios.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
    }
  };
  let createFactory = function () {
      // Register/unregister a constructor as a component.
      let Factory = {
        QueryInterface: function QueryInterface(iid){
          if (iid.equals(Ci.nsIFactory))
            return this;
          else
            throw Cr.NS_ERROR_NO_INTERFACE;
        },

        _targetConstructor: null,

        register: function register(targetConstructor) {
          this._targetConstructor = targetConstructor;
          let proto = targetConstructor.prototype;
          let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
          if(registrar.isContractIDRegistered(proto.contractID) ) {
          } else {
            registrar.registerFactory(proto.classID, proto.classDescription, proto.contractID, this);
          }
        },

        unregister: function unregister() {
          let proto = this._targetConstructor.prototype;
          let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
          registrar.unregisterFactory(proto.classID, this);
          this._targetConstructor = null;
        },

        // nsIFactory
        createInstance: function createInstance(aOuter, iid) {
          if (aOuter !== null)
            throw Cr.NS_ERROR_NO_AGGREGATION;
          return (new (this._targetConstructor)).QueryInterface(iid);
        },

        // nsIFactory
        lockFactory: function lockFactory(lock) {
          // No longer used as of gecko 1.7.
          throw Cr.NS_ERROR_NOT_IMPLEMENTED;
        }
      };
      return Factory;
  };

  if(TelnetProtocol) {
    let factory = createFactory();
    factory.register(TelnetProtocol);
    let telnetSrv = Cc[kTELNET_CONTRACTID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
    telnetSrv.setFactory(factory);
  }

  if(SshProtocol) {
    let factory = createFactory();
    factory.register(SshProtocol);
    let sshSrv = Cc[kSSH_CONTRACTID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
    sshSrv.setFactory(factory);
  }
}

function unregAll() {
  let unregTelnet = Cm.QueryInterface(Ci.nsIComponentRegistrar)
                  .isContractIDRegistered(kTELNET_CONTRACTID) ? true : false;

  let unregSsh = Cm.QueryInterface(Ci.nsIComponentRegistrar)
               .isContractIDRegistered(kSSH_CONTRACTID) ? true : false;

  if(unregTelnet) {
    let service = Cc[kTELNET_CONTRACTID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
    if(service) {
      let factory = service.getFactory();
      if(factory) {
        service.setFactory(null);
        factory.unregister();
      }
    }
  }

  if(unregSsh) {
    let service = Cc[kSSH_CONTRACTID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
    if(service) {
      let factory = service.getFactory();
      if(factory) {
        service.setFactory(null);
        factory.unregister();
      }
    }
  }
}

function run() {
  let regTelnet = Cm.QueryInterface(Ci.nsIComponentRegistrar)
                  .isContractIDRegistered(kTELNET_CONTRACTID) ? false : true;

  let regSsh = Cm.QueryInterface(Ci.nsIComponentRegistrar)
               .isContractIDRegistered(kSSH_CONTRACTID) ? false : true;

  if(regTelnet || regSsh) {
    regAll();
  }
}

addMessageListener("bbsfox@ettoolong:bbsfox-globalCommand", function(message) {
  unregAll();
  sendSyncMessage("bbsfox@ettoolong:bbsfox-globalCommand", {name:"unload"});
});

run();