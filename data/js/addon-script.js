// Coding-style-guide
// https://github.com/mozilla/addon-sdk/wiki/Coding-style-guide

let self = require("sdk/self");
let data = self.data;
let tabs = require("sdk/tabs");
let windows = require("sdk/windows").browserWindows;
let sp = require("sdk/simple-prefs");
let cm = require("sdk/context-menu");
let _ = require("sdk/l10n").get;
let bbsfoxAbout = require("./bbsfox-about.js");
let bbsfoxBg = require("./bbsfox-bg.js");
let bbsPrefs = require("./bbsfox-prefs.js");
let bbsfoxPage = require("./bbsfox-page.js").bbsfoxPage;
let aboutPage;

// preferences page - start
sp.on("openPrefsTab", () => {
  bbsfoxPage.openPreferencesPage();
});

sp.on("openUserManual", () => {
  tabs.open({
    url: "chrome://bbsfox/locale/help.html"
  });
});

sp.on("reportBug", () => {
  tabs.open({
    url: "https://github.com/ettoolong/BBSFox-E10S/issues"
  });
});
// preferences page - end

windows.on("open", win => {
  bbsfoxPage.winOpen(win);
});

tabs.on("open", tab => {
  bbsfoxPage.tabOpen(tab);
});

// context menu items - start
// These context menu items only for telnet page
cm.Item({
  label: _("cm_ansiCopy"),
  context: cm.SelectionContext(),
  contentScriptFile: data.url("js/context-menu/ansiCopy.js"),
  data: "bbsfox_menu-ansiCopy"
});

cm.Item({
  label: _("cm_openAllLink"),
  contentScriptFile: data.url("js/context-menu/openAllLink.js"),
  data: "bbsfox_menu-openAllLink",
  onMessage: () => {
    bbsfoxPage.setBBSCmd("doOpenAllLink");
  }
});

cm.Item({
  label: _("cm_viewimage"),
  contentScriptFile: data.url("js/context-menu/viewImage.js"),
  data: "bbsfox_menu-viewimage",
  onMessage: () => {
    bbsfoxPage.openNewTabs([bbsfoxPage.imageSrc], null, "UTF-8", false);
  }
});

cm.Item({
  label: _("cm_previewPicture"),
  context: cm.PredicateContext(function(context){
    bbsfoxPage.contextLink = context.linkURL;
    bbsfoxPage.selectionText = context.selectionText;
    bbsfoxPage.imageSrc = context.srcURL;
    return (context.linkURL && !(context.linkURL.search(/\.(bmp|gif|jpe?g|png)$/i) === -1));
  }),
  contentScriptFile: data.url("js/context-menu/previewPicture.js"),
  data: "bbsfox_menu-previewPicture",
  onMessage: () => {
    bbsfoxPage.setBBSCmdEx({command:"previewPicture", pictureUrl: bbsfoxPage.contextLink});
  }
});

cm.Item({
  label: _("cm_ansiColorTool"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/ansiColorTool.js"),
  data: "bbsfox_menu-ansiColorTool"
});

cm.Item({
  label: _("cm_screenKeyboard"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/screenKeyboard.js"),
  data: "bbsfox_menu-screenKeyboard"
});

cm.Item({
  label: _("cm_addTrack"),
  context: cm.SelectionContext(),
  contentScriptFile: data.url("js/context-menu/trackAdd.js"),
  data: "bbsfox_menu-addTrack"
});
cm.Item({
  label: _("cm_delTrack"),
  context: cm.SelectionContext(),
  contentScriptFile: data.url("js/context-menu/trackDel.js"),
  data: "bbsfox_menu-delTrack"
});
cm.Item({
  label: _("cm_clearTrack"),
  contentScriptFile: data.url("js/context-menu/trackClear.js"),
  data: "bbsfox_menu-clearTrack"
});

cm.Item({
  label: _("cm_mouseBrowsing"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/mouseBrowsing.js"),
  data: "bbsfox_menu-mouseBrowsing"
});

cm.Item({
  label: _("cm_switchBgDisplay"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/switchBgDisplay.js"),
  data: "bbsfox_menu-BgDisplay"
});

cm.Item({
  label: _("cm_easyRead"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/easyRead.js"),
  data: "bbsfox_menu-easyRead"
});

cm.Item({
  label: _("cm_pushThread"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/pushThread.js"),
  data: "bbsfox_menu-pushThread"
});

cm.Item({
  label: _("cm_openThreadUrl"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/openThreadUrl.js"),
  data: "bbsfox_menu-openThreadUrl"
});

cm.Item({
  label: _("cm_changeColorTable"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/changeColorTable.js"),
  data: "bbsfox_menu-changeColorTable"
});

cm.Menu({
  label: _("cm_downloadPost"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/downloadPost.js"),
  data: "bbsfox_menu-downloadPost",
  items: [
    cm.Item({ label: _("cm_downText"), data: "bbsfox_menu-downloadText" }),
    cm.Item({ label: _("cm_downAnsi"), data: "bbsfox_menu-downloadAnsi" }),
    cm.Item({ label: _("cm_downHtml"), data: "bbsfox_menu-downloadHtml" })
  ],
  onMessage: data => {
    let mode = 0;
    if(data === "bbsfox_menu-downloadText") mode = 0;
    else if(data === "bbsfox_menu-downloadAnsi") mode = 1;
    else if(data === "bbsfox_menu-downloadHtml") mode = 2;
    bbsfoxPage.setBBSCmdEx({command:"doDownloadPost", downloadColor: mode});
  }
});

cm.Item({
  label: _("cm_loadFile"),
  context: cm.PredicateContext(function(context){
    return !context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu/loadFile.js"),
  data: "bbsfox_menu-fileIo"
});

cm.Item({
  label: _("cm_addToBlacklist"),
  context: cm.SelectionContext(),
  contentScriptFile: [
    data.url("js/stringutil.js"),
    data.url("js/context-menu/blacklistAdd.js")
  ],
  data: "bbsfox_menu-addToBlacklist"
});

cm.Item({
  label: _("cm_removeFromBlacklist"),
  context: cm.SelectionContext(),
  contentScriptFile: [
    data.url("js/stringutil.js"),
    data.url("js/context-menu/blacklistDel.js")
  ],
  data: "bbsfox_menu-removeFromBlacklist"
});
// context menu items - end

exports.main = function (options, callbacks) {
  bbsPrefs.initDefaultPrefs(data);
  bbsfoxPage.init(data);

  bbsfoxPage.startListenEvent(options.loadReason);

  if (options.loadReason === "install") {
    //TODO: show user manual
    tabs.open({
      url: "chrome://bbsfox/locale/help.html"
    });
  }

  // if (options.loadReason === "install" || options.loadReason === "startup") {
  //   //TODO: set default pref value
  // }
  // if (options.loadReason === "install" || options.loadReason === "upgrade") {
  //   //TODO: show version info
  //   //TODO: update pref value, remove unused pref
  // }

  aboutPage = new bbsfoxAbout.Page();
  bbsfoxBg.mount();

  // notify all telnet page
};

exports.onUnload = function (reason) {
  if (reason !== "shutdown"){

    bbsfoxPage.stopListenEvent(reason);

    // unregister about:bbsfox page
    aboutPage.unregister();
    bbsfoxBg.unmount();

    // notify all telnet page
    bbsfoxPage.closePreferencesPage();
  }

  bbsfoxPage.cleanupTempFiles();
};
