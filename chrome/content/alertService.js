function AlertService(core, view, buf, conn) {
    this.core = core;
    this.view = view;
    this.conn = conn;
    this.prefs = core.prefs;
    this.buf = buf;
    this.tempX = 0;
    this.tempY = 0;
    this.checkCur = 0;//0 = unknow, 1 = check, 2 = don't check.
}

AlertService.prototype={
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
      this.core.sendCoreCommand({command: "fireNotifySound"}, true);
      //FIXME: support custum sound:
      //https://developer.mozilla.org/en/nsISound#play()
    },
    showPopups: function(caption, message, clickAlertAction) {
      this.core.sendCoreCommand({command: "showNotifyMessage",
                                 imageUrl: "chrome://bbsfox/skin/logo/logo.png",
                                 title: caption,
                                 text: message,
                                 replyString: clickAlertAction==2 ? this.prefs.alertReplyString : null,
                                 textClickable: (clickAlertAction==1 || clickAlertAction==2) });
    }
};
