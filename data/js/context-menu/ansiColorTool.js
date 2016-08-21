self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  return window.bbsfox.prefs.ansiColorToolMenu && !window.bbsfox.prefs.status.ansiColorToolOpened;
});

self.on("click", function(node, data) {
  window.bbsfox.overlaycmd.exec({command:"openAnsiColorTool"});
});
