// Javascript module for Unicode-at-on support
// Reference: http://moztw.org/docs/big5/
// http://moztw.org/docs/big5/table/uao250-u2b.txt

var EXPORTED_SYMBOLS = ["uaoConv"];

var uaoConv = {
    u2bTab: '',
    b2uTab: '',
    conv: Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService),

    init_u2b: function () {
        // load U2B table
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
        // load from resource:// instead of file path
        var channel = ioService.newChannel('resource://bbsfox/u2b.tab', null, null);
        var ins = channel.open();
        var bins = Components.classes["@mozilla.org/binaryinputstream;1"].
                       createInstance(Components.interfaces.nsIBinaryInputStream);
        bins.setInputStream(ins);
        while(bins.available())
            this.u2bTab += bins.readBytes(bins.available());
        bins.close();
    },

    init_b2u: function () {
        // load U2B table
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
        // load from resource:// instead of file path
        var channel = ioService.newChannel('resource://bbsfox/b2u.tab', null, null);
        var ins = channel.open();
        var bins = Components.classes["@mozilla.org/binaryinputstream;1"].
                       createInstance(Components.interfaces.nsIBinaryInputStream);
        bins.setInputStream(ins);
        while(bins.available())
            this.b2uTab += bins.readBytes(bins.available());
        bins.close();
    },

    b2u: function(data, charset) {
        if(charset.toLowerCase()=='big5') {
          if(!this.b2uTab)
              this.init_b2u(); // initialize UAO table
          var ret = '';
          var b2u = this.b2uTab; // the table
          var i, n = data.length;
          for(i = 0; i < n; ++i) {
              if(data.charCodeAt(i) >= 129 && i < n-1) { // use UAO table
                  var code = data.charCodeAt(i)*0x100 + data.charCodeAt(i+1);
                  var idx = (code - 0x8001) * 2;
                  // dump('idx = ' + idx + ', len = ' + b2u.length + '\n');
                  var uni = b2u.charCodeAt(idx)*0x100 + b2u.charCodeAt(idx+1);
                  ret += String.fromCharCode(uni);
                  ++i;
              }
              else // this is an ascii character
                  ret += data[i];
          }
          return ret;
        } else if(charset.toLowerCase()=='big5-hk') {
          return this.conv.convertStringToUTF8(data, 'big5', true, true);
        } else {
          return this.conv.convertStringToUTF8(data, charset, true, true);
        }
    },

    u2b: function(unicode_str) {
        if(!this.u2bTab)
            this.init_u2b(); // initialize UAO table
        var ret = '';
        var u2b = this.u2bTab; // the table
        var i, n = unicode_str.length;
        for(i = 0; i < n; ++i) {
            var ch = unicode_str[i];
            var code = ch.charCodeAt(0);
            if(code >= 129) { // use UAO table
                var idx = (code - 129) * 2;
                // dump('idx = ' + idx + ', len = ' + u2b.length + '\n');
                if(idx < u2b.length) {
                    var big5 = u2b[idx] + u2b[idx + 1];
                    ret += big5;
                }
            }
            else // this is an ascii character
                ret += ch;
        }
        return ret;
    }
};
