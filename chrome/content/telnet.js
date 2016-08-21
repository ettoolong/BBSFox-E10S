// Handle Telnet Connections according to RFC 854

// Telnet commands
const SE = '\xf0'
const NOP = '\xf1';
const DATA_MARK = '\xf2';
const BREAK = '\xf3';
const INTERRUPT_PROCESS = '\xf4';
const ABORT_OUTPUT = '\xf5';
const ARE_YOU_THERE = '\xf6';
const ERASE_CHARACTER = '\xf7';
const ERASE_LINE = '\xf8';
const GO_AHEAD  = '\xf9';
const SB = '\xfa';

// Option commands
const WILL  = '\xfb';
const WONT  = '\xfc';
const DO = '\xfd';
const DONT = '\xfe';
const IAC = '\xff';

// Telnet options
const ECHO  = '\x01';
const SUPRESS_GO_AHEAD = '\x03';
const TERM_TYPE = '\x18';
const IS = '\x00';
const SEND = '\x01';
const NAWS = '\x1f';

// state
const STATE_DATA=0;
const STATE_IAC=1;
const STATE_WILL=2;
const STATE_WONT=3;
const STATE_DO=4;
const STATE_DONT=5;
const STATE_SB=6;

function ConnectCore(listener) {
    this.transport = null;
    this.inputStream = null;
    this.outputStream = null;
    this.host = null;
    this.port = 23;

    this.connectCount = 0;
    this.listener=listener;
    this.prefs = listener.prefs;

    this.state=STATE_DATA;
    this.iac_sb='';
    //this.b52k3uao=window.uaotable;
    this.initial=true;
    this.utf8Buffer=[];
    this.blockSend = false;
}

ConnectCore.prototype={
    // transport service
    ts: Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService),
    ps: Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService),
    // encoding converter
    oconv: Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter),

    connect: function(host, port) {
        //alert('connect');
        if(host)
        {
          this.host = host;
          this.port = port;
        }

        //this.isConnected = false;
        // create the socket
        var proxyInfo = null;
        if (this.prefs.telnetProxyType != "") {// use a proxy
          proxyInfo = this.ps.newProxyInfo(this.prefs.telnetProxyType, this.prefs.telnetProxyHost, this.prefs.telnetProxyPort, Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST, 30, null);
        }

        this.transport = this.ts.createTransport(null, 0, this.host, this.port, proxyInfo);
        this._inputStream = this.transport.openInputStream(0,0,0);
        this.outputStream = this.transport.openOutputStream(0,0,0);
        // initialize input stream
        this.inputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        this.inputStream.setInputStream(this._inputStream);
        // data listener
        var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
        pump.init(this._inputStream, -1, -1, 0, 0, false);
        pump.asyncRead(this, null);
        this.ipump = pump;

        this.connectTime = Date.now();
        this.connectCount++;
        // Check AutoLogin Stage
        //this.listener.robot.initialAutoLogin();
    },

    close: function() {
      if(this._inputStream)
        this._inputStream.close();
      if(this.inputStream)
        this.inputStream.close();
      if(this.outputStream)
        this.outputStream.close();

      delete this._inputStream;
      delete this.inputStream;
      delete this.outputStream;
      delete this.transport;
      this._inputStream = this.inputStream = this.outputStream = this.transport = null;

      if(this.listener.abnormalClose)
        return;

      //do re-connect - start
      if(this.prefs.reconnectType == 0)
      {
        //disable
      }
      else
      {
        var ReconnectCount = this.prefs.reconnectCount;
        if(ReconnectCount && this.connectCount >= ReconnectCount) {
          this.connectFailed = true;
          return;
        }

        if(this.prefs.reconnectType == 1)
        {
          this.listener.onReconnect();
        }
        else
        {
          var time = Date.now();
          var reconnectTime = this.prefs.reconnectTime;
          if(reconnectTime <= 0)
            reconnectTime = 1;
          if ( time - this.connectTime < reconnectTime * 1000 ) {
            this.listener.onReconnect();
          }
        }
      }
    //do re-connect - end
    },

    // data listener
    onStartRequest: function(req, ctx){
      if(this.listener)
        this.listener.onConnect(this);
    },

    onStopRequest: function(req, ctx, status){
      if(this._inputStream && this.inputStream && this.outputStream)
        this.close();
      if(this.listener.abnormalClose == false)
        this.listener.onClose(this);
    },

    onDataAvailable: function(req, ctx, ins, off, count) {
        var data='';
        // dump(count + 'bytes available\n');
        while(this.inputStream && count > 0) {
            var s = this.inputStream.readBytes(count);
            count -= s.length;
            // dump(count + 'bytes remaining\n');
            var n=s.length;
            // this.oconv.charset='big5';
            // dump('data ('+n+'): >>>\n'+ this.oconv.ConvertToUnicode(s) + '\n<<<\n');
            for(var i = 0;i<n; ++i) {
                var ch=s[i];

                switch(this.state) {
                case STATE_DATA:
                    if( ch == IAC ) {
                        if(data) {
                            this.listener.onData(this, data);
                            data='';
                        }
                        this.state = STATE_IAC;
                    }
                    else
                        data += ch;
                    break;
                case STATE_IAC:
                    switch(ch) {
                    case WILL:
                        this.state=STATE_WILL;
                        break;
                    case WONT:
                        this.state=STATE_WONT;
                        break;
                    case DO:
                        this.state=STATE_DO;
                        break;
                    case DONT:
                        this.state=STATE_DONT;
                        break;
                    case SB:
                        this.state=STATE_SB;
                        break;
                    default:
                        this.state=STATE_DATA;
                    }
                    break;
                case STATE_WILL:
                    switch(ch) {
                    case ECHO:
                    case SUPRESS_GO_AHEAD:
                        this.send( IAC + DO + ch );
                        break;
                    default:
                        this.send( IAC + DONT + ch );
                    }
                    this.state = STATE_DATA;
                    break;
                case STATE_DO:
                    switch(ch) {
                    case TERM_TYPE:
                        this.send( IAC + WILL + ch );
                        break;
                    case NAWS:
                        this.send( IAC + WILL + ch );
                        this.sendNaws();
                        break;
                    default:
                        this.send( IAC + WONT + ch );
                    }
                    this.state = STATE_DATA;
                    break;
                case STATE_DONT:
                case STATE_WONT:
                    this.state = STATE_DATA;
                    break;
                case STATE_SB: // sub negotiation
                    this.iac_sb += ch;
                    if( this.iac_sb.slice(-2) == IAC + SE ) {
                        // end of sub negotiation
                        switch(this.iac_sb[0]) {
                        case TERM_TYPE: {
                            // FIXME: support other terminal types
                            var rep = IAC + SB + TERM_TYPE + IS + this.prefs.termType + IAC + SE;
                            this.send( rep );
                            break;
                            }
                        }
                        this.state = STATE_DATA;
                        this.iac_sb = '';
                        break;
                    }
                }
            }
            if(data) {
                this.listener.onData(this, data);
                data='';
            }
        }
    },

    backgroundSend: function(s){
        this.delaySendStr = s;
        if(!this.outputStream) return;
        if(this.listener)
        {
          this.listener.resetUnusedTime();
          if(!s.length) return;
          this.outputStream.write(s, s.length);
          this.outputStream.flush();
        }
    },

    send: function(str) {
        if(!this.outputStream || this.blockSend) return;
        if(this.listener)
        {
          this.listener.resetUnusedTime();
          if(!str.length) return;
          this.outputStream.write(str, str.length);
          this.outputStream.flush();
        }
    },

    convSend: function(unicode_str, charset, extbuf) {
        if(charset.toLowerCase() == 'utf-8') {
            return this.send(this.utf8Output(unicode_str));
        }
        // supports UAO
        var s;
        // when converting unicode to big5, use UAO.
        if(charset.toLowerCase() == 'big5') {
            s = uaoConv.u2b(unicode_str);
        }
        else
        {
            this.oconv.charset=charset;
            s = this.oconv.ConvertFromUnicode(unicode_str);
        }
        if(extbuf) return s;
        if(s)
        {
          s = ansiHalfColorConv(s);
          this.send(s);
        }
    },

    sendNaws: function() {
        var cols = this.prefs.bbsCol; //this.listener.buf ? this.listener.buf.cols : 80;
        var rows = this.prefs.bbsRow; //this.listener.buf ? this.listener.buf.rows : 24;
        var naws = String.fromCharCode((cols-(cols%256))/256, cols%256, (rows-(rows%256))/256, rows%256).replace(/(\xff)/g,'\xff\xff');
        var rep = IAC + SB + NAWS + naws + IAC + SE;
        this.send( rep );
    },

    utf8Output: function(str) {
      return unescape(encodeURIComponent(str));
    /*
        this.oconv.charset = 'UTF-8';
        var result = this.oconv.convertToByteArray(str, {});
        var input = '';
        for(var i=0; i<result.length; ++i)
            input += String.fromCharCode(result[i]);
        return input;
    */
    }
};
