function BBSBackground(listener) {
  this.bbscore = listener;
  this.prefs = listener.prefs;
  this.BackgroundMD5='';
  this.DisplayBackground = false;
  this.BBSBg = document.getElementById('BBSBackgroundImage');
}

BBSBackground.prototype={

  ResetBackground: function(backgroundType, md5) {
    if(backgroundType!=0 && md5!='')
    {
      var fileName;

      if(this.bbscore.isDefaultPref) {
        fileName =  "_bg.default";
      } else {
        var url = this.bbscore.siteAuthInfo;2
        url = url.replace(/:/g, '~');
        fileName = "_bg."+url;
      }
      //if(file exists)
      {
        this.BBSBg.style.backgroundImage='url(resource://bbsfox2/'+fileName+')';
        //this.BBSBg.style.backgroundImage='url(resource://bbsfox2/bbsfoxBg/'+fileName+')';
        if(backgroundType==4)
        {
          this.BBSBg.style.backgroundSize='100% 100%';
          this.BBSBg.style.backgroundPosition='left top';
          this.BBSBg.style.backgroundRepeat='no-repeat';
        }
        else if(backgroundType==3)
        {
          this.BBSBg.style.backgroundSize='cover';
          this.BBSBg.style.backgroundPosition='left top';
          this.BBSBg.style.backgroundRepeat='no-repeat';
        }
        else if(backgroundType==2)
        {
          this.BBSBg.style.backgroundSize='auto auto';
          this.BBSBg.style.backgroundPosition='center center';
          this.BBSBg.style.backgroundRepeat='no-repeat';
        }
        else if(backgroundType==1)
        {
          this.BBSBg.style.backgroundSize='auto auto';
          this.BBSBg.style.backgroundPosition='center center';
          this.BBSBg.style.backgroundRepeat='repeat';
        }
      }
      /*
      else {
        console.log('file not exists');
        backgroundType=0;
      }
      */
      //try to load picture, if load fail, set backgroundType = 0;
    }
    if(backgroundType==0)
    {
      this.BBSBg.style.display='none';
      this.prefs.updateOverlayPrefs([{key:'enableBackground', value:false}]);
      this.DisplayBackground=true; //?
      this.BackgroundMD5='';
    }
    else
    {
      this.BBSBg.style.display='block';
      this.prefs.updateOverlayPrefs([{key:'enableBackground', value:true}]);
      this.DisplayBackground=true;
    }
  },

  SwitchBgDisplay: function() {
    if(this.DisplayBackground)
    {
      this.DisplayBackground = false;
      this.BBSBg.style.display='none';
    }
    else
    {
      this.DisplayBackground = true;
      this.BBSBg.style.display='block';
    }
  },

  SetBrightness: function(brightness) {
    if(brightness == 100)// no alpha
      this.BBSBg.style.opacity = '1';
    else
      this.BBSBg.style.opacity = '0.' + (brightness);
  },

  SetSize: function(w, h) {
    this.BBSBg.style.height = h;
    this.BBSBg.style.width = w;
  }

};
