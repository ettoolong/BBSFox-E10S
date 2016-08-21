self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }

  if(window.bbsfox.prefs.keyWordTrackMenu) {
    let selstr = window.getSelection().toString().replace('\r\n','\n');
    let strArray = selstr.split('\n');
    let prefs = window.bbsfox.prefs;
    let highlightWords_raw = prefs.highlightWords_local;
    let highlightWords_lowCase = prefs.highlightWords_local.join('\n').toLowerCase().split('\n');

    selstr = window.bbsfox.trim_both(strArray[0]);
    if(selstr != '') {
      let findflag = false;
      if(prefs.keyWordTrackCaseSensitive) {
        findflag = (highlightWords_raw.indexOf(selstr) !== -1);
      }
      else {
        findflag = (highlightWords_lowCase.indexOf(selstr.toLowerCase()) !== -1);
      }
      return !findflag;
    }
    return false;
  }
  else {
    return false;
  }
});

self.on("click", function(node, data) {
  //self.postMessage();
  window.bbsfox.overlaycmd.exec({command:"doAddTrack"});
});
