kryptos.hash.HMAC = function(key, msg, digestmod) {
  var hasher = Cc["@mozilla.org/security/hmac;1"].createInstance(Ci.nsICryptoHMAC);
  var keyObject = Cc["@mozilla.org/security/keyobjectfactory;1"]
                  .getService(Ci.nsIKeyObjectFactory)
                 .keyFromString(Ci.nsIKeyObject.HMAC, key);

  hasher.init(digestmod, keyObject);
  var data = kryptos.toByteArray(msg);
  hasher.update(data, data.length);
  return hasher.finish(false);
};

kryptos.hash.HMAC_SHA = Cc["@mozilla.org/security/hmac;1"].createInstance(Ci.nsICryptoHMAC).SHA1;
kryptos.hash.HMAC_MD5 = Cc["@mozilla.org/security/hmac;1"].createInstance(Ci.nsICryptoHMAC).MD5;
