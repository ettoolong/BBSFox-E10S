function Aidhandler() {

}

Aidhandler.prototype={
  aid_base64_table: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",

  repeat: function (str_in, count) {
    if (str_in == null) {
      throw new TypeError('can\'t convert null to object');
    }
    var str = '' + str_in;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (august 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    return rpt;
  },
 
  rjust: function (str, width, padding) {
    padding = (padding || " ").substr(0, 1);
    if (str.length < width) {
      //return padding.repeat(width - str.length) + str;
      return this.repeat(padding, width - str.length) + str;
    }
    else {
      return str;
    }
  },

  aidc2aidu: function (aidc) {
    var aidu = 0;
    for (var i = 0; i < aidc.length; i++) {
      var ch = aidc.charAt(i);
      var v = this.aid_base64_table.indexOf(ch);
      aidu = aidu * Math.pow(2, 6); // aidu <<= 6
      aidu = aidu - (aidu & 0x3f) + ((aidu & 0x3f) | (v & 0x3f)); // aidu |= (v & 0x3f);
    }
    return aidu;
  },
  
  aidu2fn: function (aidu) {
    var type = ((aidu / Math.pow(2, 44)) & 0xf); // type = ((aidu >> 44) & 0xf);
    var v1 = ((aidu / Math.pow(2, 12)) & 0xffffffff); // v1 = ((aidu >> 12) & 0xffffffff);
    var v2 = (aidu & 0xfff);
    var tmps = (type == 0 ? "M" : "G") + "." + v1.toString(10) + ".A." + v2.toString(16).toUpperCase();
    var filename = this.rjust(tmps, 3, "0");
    return filename;
  },
 
  buildUrl: function(boardName, fileName) {
    var protocol = 'https:';
    var hostname = 'www.ptt.cc';
    var port = ':443';
    var url = protocol + "//" + hostname + port + "/bbs/" + boardName + "/" + fileName + ".html";
    return url;
  },
  
  pttArticleUrlFromAidc: function (aidc, boardName) {
    // aidc should match [0-9a-zA-Z_\-]{8}
    var aidu = this.aidc2aidu(aidc);
    var fileName = this.aidu2fn(aidu);
    var articleUrl = this.buildUrl(boardName, fileName);
    //console.log("aidc =", aidc, "boardName =", boardName);
    return articleUrl;
  },
  
};
