self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  return window.bbsfox.prefs.changeColorTableMenu;
});

self.on("click", function(node, data) {
  window.bbsfox.overlaycmd.exec({command:"changeColorTable"});
});
