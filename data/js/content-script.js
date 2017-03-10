// console.log("load content-script");
function sendCommand(message, async){
  self.port.emit("bbsfox@ettoolong:bbsfox-coreCommand", message);
}
sendCommand({command: "contentScriptReady"}, true);

self.port.on("bbsfox@ettoolong:bbsfox-overlayCommand", data => {
  if(window.bbsfox) {
    window.bbsfox.overlaycmd.exec(data);
  }
});

//socket data & event - start
self.port.on("bbsfox@ettoolong:bbsfox-connect", () => {
  if(window.bbsfox) {
    window.bbsfox.conn.onStartRequest();
  }
});
self.port.on("bbsfox@ettoolong:bbsfox-disconnect", msg => {
  if(window.bbsfox) {
    window.bbsfox.conn.onStopRequest(msg.status);
  }
});
self.port.on("bbsfox@ettoolong:bbsfox-data", msg => {
  if(window.bbsfox) {
    window.bbsfox.conn.onDataAvailable(msg.data);
  }
});
//socket data & event - end

self.port.on("detach", function() {
  // cleanup();
  if(window.bbsfox) {
    window.bbsfox.overlaycmd.exec({command: "unload"});
  }
});

if(window.bbsfox) {
  window.bbsfox.setContentScript(sendCommand, true);
}
else {
  document.body.addEventListener("bbsfoxReady", event => {
    window.bbsfox.setContentScript(sendCommand, true);
  });
}
