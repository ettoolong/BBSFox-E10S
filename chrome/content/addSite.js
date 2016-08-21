function setAcceptBtn(enable) {
  document.getElementById("bbsfox-addSite").setAttribute("buttondisabledaccept", !enable);
}

function btnCancelClick() {
  return false;
}

function btnOkClick() {
  let retVals = window.arguments[0];
  retVals.sitename  = document.getElementById("siteName").value;
  retVals.siteaddr = document.getElementById("siteAddr").value.toLowerCase();
  return true;
}

function checkValue() {
  //if site already exists, disable ok button
  let sn = document.getElementById("siteName").value;
  let sa = document.getElementById("siteAddr").value;
  if(sn === "" || sa === "") {
    setAcceptBtn(false);
    return;
  }

  let url = sa.toLowerCase();
  let url2;
  let addEnabled = (url.length > 0 && url.charCodeAt(url.length-1) !== 46 );

  if(addEnabled) {
    let splits = url.split(/:/g);
    if(splits.length === 1) {
      url2 = url.replace(/\./g, "");
      if(url2.match(/\W/))
        addEnabled = false;
    }
    else if(splits.length === 2) {
      if(splits[0] === "" || splits[1] === "") {
        addEnabled = false;
      }
      else {
        url2 = splits[0].replace(/\./g, "");
        if(url2.match(/\W/))
          addEnabled = false;
        if(splits[1].match(/\D/))
          addEnabled = false;
      }
    }
    else {
      addEnabled = false;
    }
  }

  if(addEnabled) { //check exists
    let existSite = window.arguments[1];
    addEnabled = !(existSite.includes(url));
  }
  setAcceptBtn(addEnabled);
}
