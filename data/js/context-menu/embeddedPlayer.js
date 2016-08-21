self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  return window.bbsfox.prefs.embeddedPlayerMenu;
});

self.on("click", function(node, data) {
  self.postMessage(data);
});
