self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }

  if(window.bbsfox.prefs.keyWordTrackMenu) {
    let highlightWords = window.bbsfox.prefs.highlightWords_local;
    return (highlightWords.length > 0);
  }
  else {
    return false;
  }
});

self.on("click", function(node, data) {
  //self.postMessage();
  window.bbsfox.overlaycmd.exec({command:"doClearTrack"});
});
