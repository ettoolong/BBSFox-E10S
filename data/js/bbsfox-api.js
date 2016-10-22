"use strict";

const tabs = require("sdk/tabs");
const tabUtils = require("sdk/tabs/utils");

const apiKeys = [
  "checkFireGestureKey", "doPageUp", "doPageDown",
  "doEnd", "doHome", "doArrowLeft",
  "doArrowUp", "doArrowRight", "doArrowDown",
  "doCopy", "doCopyAnsi", "doPaste",
  "doSelectAll", "doOpenAllLink", "switchMouseBrowsing",
  "switchBgDisplay", "easyReading", "pushThread",
  "openThreadUrl", "changeColorTable", "doDownloadPost",
  "doLoadFile", "switchSymbolInput", "switchAnsiColorTool",
  "previewPicture", "closePictureViewer", "sendCodeStr"
];

const setBBSCmdEx = (commandSet) => {
    if(commandSet.command && apiKeys.indexOf(commandSet.command) !== -1 ) { //only allow command that list in apiKeys
      let tab = tabs.activeTab;
      let xulTab = tabUtils.getTabForId(tab.id);
      let target = tabUtils.getBrowserForTab(xulTab);
      let browserMM = target.messageManager;
      browserMM.sendAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", commandSet);
    }
};
exports.setBBSCmdEx = setBBSCmdEx;

const setBBSCmd = (command) => {
    setBBSCmdEx({command: command});
};
exports.setBBSCmd = setBBSCmd;
