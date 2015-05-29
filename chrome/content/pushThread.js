var BBSPushThread = {
  lineLength : 54,

  init: function () {
    var retVals = window.arguments[0];
    if(retVals.pushText)
      document.getElementById("pushThreadText").value = retVals.pushText;
    this.lineLength = retVals.lineLength;
    this.setPreview();
    return true;
  },

  finish: function () {
    return true;
  },

  onSendAllText: function () {
    var retVals = window.arguments[0];
    var retVals2 = window.arguments[1];
    var strArray = document.getElementById("textPreview").value.split('\n');
    pushtype = document.getElementById("PushthreadType").value;
    for(var i=0;i<strArray.length;++i)
    {
      if(i==0 && pushtype!='4')
        strArray[i]="%" + pushtype + strArray[i];
      else
        strArray[i]="%" + strArray[i];
      retVals2.push(strArray[i]);
    }
    retVals.exec = true;
    return true;
  },

  onCancel: function () {
    var retVals = window.arguments[0];
    retVals.pushText = document.getElementById("pushThreadText").value;
    return true;
  },

  setPreview: function () {
    var text = document.getElementById("pushThreadText").value;
    var preview = document.getElementById("textPreview");
    text=text.replace(/\r\n/g, '');
    text=text.replace(/\n/g, '');
    document.getElementById("pushThreadWindow").setAttribute('buttondisabledaccept', (text.length==0));
    var tempText = "";
    var tempTextLen = 0;
    var preText = "";
    preview.value = "";

    for(var i=0;i<text.length;++i)
    {
      var nextLen = 1;
      var c = text[i].match(/[^ -~]/g);
      if(c && c.length)
        nextLen = 2;

      if(tempTextLen + nextLen > this.lineLength)
      {
        preText = preview.value;
        if(preview.value.length)
          preview.value += ("\n" + tempText);
        else
          preview.value+=tempText;
        tempText = text[i];
        tempTextLen = nextLen
      }
      else
      {
        tempTextLen += nextLen;
        tempText+=text[i];
      }
    }
    if(preview.value.length)
      preview.value += ("\n" + tempText);
    else
      preview.value+=tempText;

    return true;
  }
};
