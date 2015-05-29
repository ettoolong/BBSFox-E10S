//fire event from bbsfox overlay
addMessageListener("bbsfox@ettoolong:bbsfox-overlayCommand",
  function(message) {
	  var bbscore = content.bbsfox;
	  if(bbscore) {
      //console.log('command = ' + message.data.command + ', url = ' + content.document.location.hostname);
      bbscore.overlaycmd.exec(message.data);
    }
  }
);

//fire event from bbsfox overlay tabAttrModified
addMessageListener("bbsfox@ettoolong:bbsfox-overlayEvent",
  function(message) {
	  var bbscore = content.bbsfox;
	  if(bbscore) {
      bbscore.setFrameScript( function(command, async){
      	if(!async)
      	  return sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
      	else
      		return sendAsyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", command);
      }.bind(this));
    } else {
    	sendSyncMessage("bbsfox@ettoolong:bbsfox-coreCommand", {command:"removePrefs"});
    }
  }
);
