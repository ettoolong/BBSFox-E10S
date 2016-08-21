kryptos.hash.SHA = function(str) {
  inherit(this, new kryptos.hash.baseHash(str));
}

kryptos.hash.SHA.digest_size = 20;

kryptos.hash.SHA.prototype = {
  type : 'sha1'
};
