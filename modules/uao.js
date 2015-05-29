// Javascript module for Unicode-at-on support
// Reference: http://moztw.org/docs/big5/
// http://moztw.org/docs/big5/table/uao250-u2b.txt

var EXPORTED_SYMBOLS = ["uaoConv"];

var uaoConv = {
    u2bTab: '',
    init: function () {
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

    u2b: function(ustr) {
        var ret = '';
        if(!this.u2bTab)
            this.init(); // initialize UAO table
        var u2b = this.u2bTab; // the table
        var i, n = ustr.length;
        for(i = 0; i < n; ++i) {
            var ch = ustr[i];
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
