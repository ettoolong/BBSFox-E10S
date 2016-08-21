self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  return window.bbsfox.prefs.screenKeyboardMenu && !window.bbsfox.prefs.status.screenKeyboardOpened;
});

self.on("click", function(node, data) {
  window.bbsfox.overlaycmd.exec({command:"openSymbolInput"});
});
