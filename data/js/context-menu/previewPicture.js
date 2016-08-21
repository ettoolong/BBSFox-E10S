self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  return window.bbsfox.prefs.previewPictureMenu;
});

self.on("click", function(node, data) {
  self.postMessage(data);
});
