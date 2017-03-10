//this javascript file ONLY for telnet.htm. Because we remove all inline javascript code from 'telnet.htm' and 'ssh.htm'.
var bbsfox;

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
  //bbsfox.connect();//document.location.host

  var evt = new CustomEvent("bbsfoxReady", { bubbles: false, detail: '' });
  document.body.dispatchEvent(evt);

}

function release() {
  //document.getElementById('t').disabled="disabled";
  if(bbsfox) {
    bbsfox.prefListener.unregister();
    bbsfox.close();
    bbsfox=null;
  }
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
