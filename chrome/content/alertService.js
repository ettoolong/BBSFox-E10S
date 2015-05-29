function AlertService(core, view, buf, conn) {
    this.core = core;
    this.view = view;
    this.conn = conn;
    this.prefs = core.prefs;
    this.buf = buf;
    this.tempX = 0;
    this.tempY = 0;
    this.checkCur = 0;//0 = unknow, 1 = check, 2 = don't check.
    var as = Components.classes["@mozilla.org/alerts-service;1"];
    try
    {
      this.service = as.getService(Components.interfaces.nsIAlertsService);
    }
    catch(error)
    {
      this.service = null;
    }
}

AlertService.prototype={
    //service : Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService),
    service : null,
    alertTimer : null,
    lastMsgTime : 0,
    alert: function(blockByTime, showMsg, playSound, msg, clickAlertAction) {
      if(this.checkCur==0)
      {
        if(this.core.isPTT())
          this.checkCur = 1;
        else
          this.checkCur = 2;
      }

      if(!showMsg && !playSound)
        return;
      if(msg!=""){
        var execAlert = true;
        if(blockByTime)
        {
          var timeN = new Date();
          var timeT = Math.floor(timeN.getTime()/1000);
          if(this.lastMsgTime != timeT)
            this.lastMsgTime = timeT;
          else
            execAlert = false;
        }
        if(execAlert)
        {
          if(playSound)
            this.beep(msg);
          if(showMsg)
            this.showPopups(document.title, msg, this.prefs.clickAlertAction);
        }
      }
      else{
        this.cancelAlertTimer();
        var _this=this;
        this.tempX = this.buf.cur_x;
        this.tempY = this.buf.cur_y;
        var func=function() {
          if((_this.buf.cur_y==_this.buf.rows-1 || _this.buf.cur_y==_this.buf.rows-2) && (_this.tempX != _this.buf.cur_x || _this.tempY != _this.buf.cur_y || _this.checkCur==2) ){
            _this.tempX = 0;
            _this.tempY = 0;
            var msg = _this.getMsg(_this.buf.cur_y);
            var column = msg.replace(/^ +/,"").split(" ");
            var summary = document.title + " - " + column.shift();
            var body = column.join(" ");
            if(playSound)
              _this.beep(msg);
            if(showMsg)
              _this.showPopups(summary, body, _this.prefs.clickAlertAction);
          }
          else{
            //don't notify
            //alert('_this.tempX = '+_this.tempX+", _this.tempY = " + _this.tempY);
          }
        };
        this.alertTimer = setTimer(false, func, 200);
      }
    },

    cancelAlertTimer: function() {
      if(this.alertTimer)
      {
        this.alertTimer.cancel();
        this.alertTimer=null;
      }
    },

    getMsg: function(row) {
        var text = this.buf.getRowText(row, 0, this.buf.cols);
        return text.replace(/ +$/,"");
    },

    beep: function(msg) {
      var sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
      //if(msg) {
      //    sound.playEventSound(sound.EVENT_NEW_MAIL_RECEIVED);
      //} else {
            sound.beep();
      //}
      //FIXME: support custum sound:
      //https://developer.mozilla.org/en/nsISound#play()
    },

    showPopups: function(caption, message, clickAlertAction) {
      //FIXME: PopupNotifications.jsm is an alternative but works only in FX4+
      // nsIPromptService is more flexible but more coding is needed
      this.listener = {
        observe: function(subject, topic, data) {
          if(topic == 'alertclickcallback')
          {
          	//TODO: set window and tab to focus. send a message to do this.
          	//this.sendCoreCommand({command: "setTabFocus"});
            //bbsfox.GetBrowser(true, true);
            if(bbsfox.prefs.clickAlertAction==2)
              bbsfox.conn.send(bbsfox.prefs.alertReplyString);
          }
        }
      };

      if(this.service)
      {
        if(clickAlertAction==1 || clickAlertAction==2)
          this.service.showAlertNotification("chrome://bbsfox/skin/logo/logo.png", caption, message, true, '', this.listener);
        else
          this.service.showAlertNotification("chrome://bbsfox/skin/logo/logo.png", caption, message, flase, '', null);
      }
      //this.service.showAlertNotification("chrome://bbsfox/skin/logo/logo.png", caption, message, true, '', this.core);
      //FIXME: Should we set the active tab as this page?
      //https://developer.mozilla.org/En/NsIAlertsService
    }
};
