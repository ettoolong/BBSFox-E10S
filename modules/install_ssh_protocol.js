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

//reference: Using JavaScript code modules
//https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Using

var EXPORTED_SYMBOLS = ["SshProtocol"];

// SSH protocol related
const kSCHEME = "ssh";
// Mozilla defined
const kSTANDARDURL_CONTRACTID = "@mozilla.org/network/standard-url;1";
const kIOSERVICE_CONTRACTID   = "@mozilla.org/network/io-service;1";

const nsISupports        = Components.interfaces.nsISupports;
const nsIIOService       = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI             = Components.interfaces.nsIURI;
const nsIStandardURL     = Components.interfaces.nsIStandardURL;

function SshProtocol(){}

SshProtocol.prototype =
{
  classDescription: "SSH Protocol",
  classID: Components.ID("{dbc42190-21eb-11e0-ac64-0800200c9a66}"),
  contractID: "@mozilla.org/network/protocol;1?name="+ kSCHEME,
  QueryInterface: function QueryInterface(iid){
    if (iid.equals(Components.interfaces.nsIProtocolHandler))
      return this;
    else
      throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  scheme: kSCHEME,
  defaultPort: 22,
  protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                 nsIProtocolHandler.URI_NOAUTH |
                 nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

  allowPort: function(port, scheme) {
    return false;
  },

  newURI: function(spec, charset, baseURI) {
    // for nsStandardURL test - http://groups.google.com.tw/group/pcmanfx/browse_thread/thread/ec757aa8c73b1432#
    // Parameters:
    // * aUrlType: URLTYPE_AUTHORITY will always convert ssh:, ssh:/, ssh://, ssh:/// to ssh://
    // * aDefaultPort: will convert ssh://ptt.cc:22 to ssh://ptt.cc
    var url = Components.classes[kSTANDARDURL_CONTRACTID].createInstance(nsIStandardURL);
    url.init(nsIStandardURL.URLTYPE_AUTHORITY, 22, spec, charset, baseURI);
    // Filter and return the pure URI
    var cleanURI = url.QueryInterface(nsIURI);
    var PttRegEx = /^((bbs\.)?(ptt(2|3)?\.cc)|(ptt(2|3)?\.twbbs\.org))$/i;
    if(!PttRegEx.test(cleanURI.host)) //ONLY allow site ptt/ptt2/ptt3 keep username
      cleanURI.userPass = '';
    cleanURI.path = '';
    return cleanURI;
  },

  newChannel: function(aURI) {
    // create dummy nsIURI and nsIChannel instances
    var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);
    return ios.newChannel('chrome://bbsfox/content/ssh.html', null, null);
  }
};