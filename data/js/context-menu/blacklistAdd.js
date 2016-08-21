self.on("context", function (node) {
  if(!window.bbsfox) {
    return false;
  }
  //TODO: bbsfox.buf.PageState always == 0, if mouse browsering == false
  let bbsfox = window.bbsfox;
  let prefs = bbsfox.prefs;
  if(!window.getSelection().isCollapsed && prefs.enableBlacklist && prefs.blacklistMenu) {
    //check blacklist id
    let selstr = window.getSelection().toString().toLowerCase();
    if(selstr && selstr.indexOf('\n') == -1) {
      selstr = selstr.replace(/^\s+|\s+$/g,'');
      let userid = '';
      let selection = bbsfox.view.getSelectionColRow();
      //if(selection.start.row)
      let rowText = bbsfox.buf.getRowText(selection.start.row, 0, bbsfox.buf.cols);
      if (bbsfox.buf.PageState === 3 && bbsfox.isPTT()) {
        userid = parsePushthreadForUserId(rowText);//
      }
      else if (bbsfox.buf.PageState === 2) {
        userid = parseThreadForUserId(rowText);//
      }
      if (userid && selstr == userid) {
        if( prefs.blacklistedUserIds.indexOf(userid) === -1 ) {
          //not in blacklist, show item 'add to blacklist'
          return true;
        }
      }
    }
  }
  return false;
});

self.on("click", function(node, data) {
  window.bbsfox.overlaycmd.exec({command:"addToBlacklist"});
});
