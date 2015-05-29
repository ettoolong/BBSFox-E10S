function setAcceptBtn(enable) {
  document.getElementById('bbsfox-addSite').setAttribute('buttondisabledaccept', !enable);
}

function btnCancelClick() {
  return false;
}

function btnOkClick() {
  var retVals = window.arguments[0];
  retVals.sitename  = document.getElementById("siteName").value;
  retVals.siteaddr = document.getElementById("siteAddr").value.toLowerCase();
  return true;
}

function checkValue() {
  //if site already exists, disable ok button
  var sn = document.getElementById("siteName").value;
  var sa = document.getElementById("siteAddr").value;
  if(sn=='' || sa=='')
  {
    setAcceptBtn(false);
    return;
  }

  var url = sa.toLowerCase();
  var url2;
  var addEnabled = (url.length > 0 && url.charCodeAt(url.length-1)!=46 );
  
  if(addEnabled){
    var splits = url.split(/:/g);
    if(splits.length == 1)
    {
      url2 = url.replace(/\./g,'');
      if(url2.match(/\W/))
        addEnabled = false;
    }
    else if(splits.length == 2)
    {
      if(splits[0]=='' || splits[1]=='')
        addEnabled = false;
      else
      {
        url2 = splits[0].replace(/\./g,'');
        if(url2.match(/\W/))
          addEnabled = false;
        if(splits[1].match(/\D/))
          addEnabled = false;
      }
    }
    else
    {
      addEnabled = false;
    }
  }

  if(addEnabled){ //check exists
    var existSite = window.arguments[1];
    for(var i=0;i<existSite.length;++i){
      if(existSite[i]==url){
        addEnabled = false;
        break;
      }
    }
  }
  setAcceptBtn(addEnabled);
}