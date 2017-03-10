// SSH Connection porting from firessh 0.93.1

function ConnectCore(listener) {
  this.host = null;
  this.port = BBSFOX_DEFAULT_PORT;

  this.connectCount = 0;
  this.listener = listener;
  this.prefs = listener.prefs;

  this.blockSend = false;

  this.utf8Buffer=[];

  this.shell = null;
  this.client = null;
  this.privatekey = '';
  this.alive = false;
}

ConnectCore.prototype={
    // encoding converter
    oconv: Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter),

    connect: function(host, port, extData, hostkeys) {
        //alert('connect');

        if(host)
        {
          this.host = host;
          this.port = port;
        }

        this.isConnected = false;
        //this.inputStream = true;

        var acc = [];
        if(this.prefs.sshLoginType==0)
        {
          if(extData) {
            acc[0] = extData.userName;
            acc[1] = extData.password;
          }

          var ioService  = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
          var uri = ioService.newURI(document.URL, null, null);
          var user = uri.username;
          var pwd = uri.password;

          if(user != '')
          {
            acc[0] = user;
            acc[1] = pwd;
          }
          // if connect to ptt and ssh password =='', just set password to any string, because the server not check it!
          if(this.listener.isPTT() && acc[1]=='')
            acc[1] = 'a';
        }
        else
        {
          acc[0] = 'anonymous';
          acc[1] = 'firessh@example.com';
        }

        var self = this;
        var shell_success = function(shell) {
          self.shell = shell;
        };

        this.client = new paramikojs.SSHClient();
        this.client.set_missing_host_key_policy(new paramikojs.AutoAddPolicy()); //always save new key
        //this.client.set_missing_host_key_policy(new paramikojs.AskPolicy());     //always ask use
        //this.client.set_missing_host_key_policy(new paramikojs.RejectPolicy());  //always reject different key
        //this.client.set_missing_host_key_policy(new paramikojs.WarningPolicy()); //always warning for different key
        //this.client.set_missing_host_key_policy(new paramikojs.AskPolicy(this.onSftpCache.bind(this))); //TODO: add a pref for this.
        //this.client.load_host_keys('known_hosts');
        this.client.load_host_keys_lines(hostkeys);

        var auth_success = function() {
          self.client.invoke_shell('xterm-256color', self.listener.buf.cols, self.listener.buf.rows, shell_success);
        };

        var write = function(str) {
          if (str) {
            self.listener.resetUnusedTime();
            if(!str.length) return;
            self.listener.sendCoreCommand({command: "sendData", str: str});
            // self.outputStream.write(str, str.length);
            // self.outputStream.flush();
          }
        };

        // create the socket
        this.listener.sendCoreCommand({
          command: "createSocket",
          host: host,
          port: port,
          proxy: {
            type: this.prefs.sshProxyType,
            host: this.prefs.sshProxyHost,
            port: this.prefs.sshProxyPort
          }
        });

        this.sshTransport = this.client.connect(write, auth_success, this.host, this.port, acc[0], acc[1], null, this.privatekey, 0, true, false);

        // var proxyInfo = null;
        // if (this.prefs.sshProxyType != "") {// use a proxy
        //   proxyInfo = this.ps.newProxyInfo(this.prefs.sshProxyType, this.prefs.sshProxyHost, this.prefs.sshProxyPort, Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST, 30, null);
        // }

        // this.transport = this.ts.createTransport(null, 0, this.host, this.port, proxyInfo);
        // this._inputStream = this.transport.openInputStream(0,0,0);
        // this.outputStream = this.transport.openOutputStream(0,0,0);
        // // initialize input stream
        // this.inputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        // this.inputStream.setInputStream(this._inputStream);
        // // data listener
        // var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
        // pump.init(this._inputStream, -1, -1, 0, 0, false);
        // pump.asyncRead(this, null);
        // this.ipump = pump;

        this.connectTime = Date.now();
        this.connectCount++;
        // Check AutoLogin Stage
        //this.listener.robot.initialAutoLogin();
    },

    close: function() {

      // if(this._inputStream)
      //   this._inputStream.close();
      // if(this.inputStream)
      //   this.inputStream.close();
      // if(this.outputStream)
      //   this.outputStream.close();

      // delete this._inputStream;
      // delete this.inputStream;
      // delete this.outputStream;
      // delete this.transport;
      // this._inputStream = this.inputStream = this.outputStream = this.transport = null;

      //ssh - start
      this.isConnected = false;
      this.client.close(true);
      //ssh - end

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
      this.shell = null;
    },

    // data listener
    onStartRequest: function(){
      this.alive = true;
      if(this.listener)
        this.listener.onConnect(this);
    },

    onStopRequest: function(status){
      //if(this._inputStream && this.inputStream && this.outputStream)
      this.alive = false;
      this.close();
      if(this.listener.abnormalClose == false)
        this.listener.onClose(this);
    },

    onDataAvailable: function(s) {
        //var str='';
        // dump(count + 'bytes available\n');
        count = s.length;
        while(count > 0) {
            // var s = this.inputStream.readBytes(count);
            count -= s.length;
            if(s.length) {
              try {
                this.sshTransport.fullBuffer += s;  // read data
                this.sshTransport.run();
              } catch(ex) {
                //console.log(ex);
                if (ex instanceof paramikojs.ssh_exception.AuthenticationException) {
                  this.client.legitClose = true;
                  return;
                }
              }
              var data = '';
              try {
                if (!this.shell) {
                  return;
                }
                if (this.shell.closed) {
                  this.close();
                  return;
                }
                data = this.shell.recv(65536);
              } catch(ex) {
                if (ex instanceof paramikojs.ssh_exception.WaitException) {
                  // some times no data comes out, dont care
                  continue;
                } else {
                  throw ex;
                }
              }
              if(!this.isConnected) {
                this.isConnected = true;
                var buf = this.listener.buf;
                buf.scroll(false, buf.curY);
                buf.curY = 0;
              }
              if (data) {
                this.listener.onData(this, data);
              }
            }
        }
    },

    backgroundSend: function(s){
      this.delaySendStr = s;
        if(!this.alive) return;
        if(this.listener)
        {
          this.listener.resetUnusedTime();
          if(!s.length) return;
          this.shell.send(s);
        }
    },

    send: function(str) {
        if(!this.alive || this.blockSend) return;
        if(this.listener)
        {
          this.listener.resetUnusedTime();
          this.shell.send(str);
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
        this.shell.resize_pty(cols, rows);
        //var naws = String.fromCharCode((cols-(cols%256))/256, cols%256, (rows-(rows%256))/256, rows%256).replace(/(\xff)/g,'\xff\xff');
        //var rep = IAC + SB + NAWS + naws + IAC + SE;
        //this.send( rep );
    },

    utf8Output: function(str) {
      return unescape(encodeURIComponent(str));
    },

    onSftpCache: function(buffer, new_key, cacheCallback) {
      var key;

      if (new_key) {
        key = new_key;
      } else {
        var key = buffer.replace(/\r\n/g, "\n").split("\n");
        var index = 4;

        for (var x = 0; x < key.length; ++x) {
          if (key[x].indexOf('is:') != -1) {
            index = x + 1;
            break;
          }
        }

        key = key[index];
      }
      var promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
      var flags    = promptService.BUTTON_TITLE_YES    * promptService.BUTTON_POS_0 +
                     promptService.BUTTON_TITLE_NO     * promptService.BUTTON_POS_2 +
                     promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_1;
      var response = promptService.confirmEx(window, this.listener.getLMBundle().GetStringFromName("sftpCacheTitle"),
                                                     this.listener.getLMBundle().formatStringFromName("sftpCache", [key], 1), flags,
                                                     null, null, null, null, {});
      cacheCallback(response == 0 ? 'y' : (response == 2 ? 'n' : ''));
    }
};
