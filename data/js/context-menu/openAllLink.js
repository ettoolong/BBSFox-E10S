self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  let allLinks = window.document.getElementsByTagName('a');
  return window.bbsfox.prefs.openAllLinkMenu && (allLinks.length > 0);
});

self.on("click", function(node, data) {
  self.postMessage();
});
