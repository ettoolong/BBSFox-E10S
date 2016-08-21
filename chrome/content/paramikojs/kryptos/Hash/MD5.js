kryptos.hash.MD5 = function(str) {
  inherit(this, new kryptos.hash.baseHash(str));
}

kryptos.hash.MD5.digest_size = 16;

kryptos.hash.MD5.prototype = {
  type : 'md5'
};
