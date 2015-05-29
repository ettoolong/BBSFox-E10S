//this javascript file ONLY for telnet.htm. Because we remove all inline javascript code from 'telnet.htm'.
var bbsfox=null;

const BBSFOX_DEFAULT_PORT = 23;

function startup() {
  document.title = document.location.host;
  bbsfox=new BBSFox();
  var browserutils = new BBSFoxBrowserUtils();
  document.title = browserutils.findSiteTitle(document.location.hostname, document.location.port ? document.location.port : BBSFOX_DEFAULT_PORT); //try to find site title.
  bbsfox.isDefaultPref = browserutils.isDefaultPref;
  bbsfox.siteAuthInfo = browserutils.siteAuthInfo;
  bbsfox.prefListener = browserutils.prefListener(function(branch, name) {
    bbsfox.prefs.onPrefChange(bbsfox, branch, name);
  }, bbsfox.prefs);
  if(bbsfox.prefs.preventNewTongWenAutoConv)
  {
    var tongwen = document.getElementById("tongwen_font");
    if (tongwen != null)
      tongwen.parentNode.removeChild(tongwen);
  }
  bbsfox.setInputAreaFocus();
  resize();
  bbsfox.connect();//document.location.host
}

function release() {
  //document.getElementById('t').disabled="disabled";
  bbsfox.prefListener.unregister();
  bbsfox.cleanupTempFiles();
  bbsfox.close();
  bbsfox=null;
  window.removeEventListener('load', startup, true);
  window.removeEventListener('unload', release, true);
  window.removeEventListener('resize', resize, false);
}

function resize() {
  if(bbsfox)
    bbsfox.view.fontResize();
}

window.addEventListener('load', startup, true);
window.addEventListener('unload', release, true);
window.addEventListener('resize', resize, false);