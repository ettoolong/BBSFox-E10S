kryptos.hash.SHA256 = function(str) {
  inherit(this, new kryptos.hash.baseHash(str));
}

kryptos.hash.SHA256.digest_size = 32;

kryptos.hash.SHA256.prototype = {
  type : 'sha256'
};
