"use strict";

const tabs = require("sdk/tabs");
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
const urlCheck = /(^(telnet|ssh):\/\/)/i;

let callback = null;

const setCallback = (cb) => {
  callback = cb;
}

const setBBSCmdEx = (commandSet) => {
  //console.log(commandSet);
  if(commandSet.command && apiKeys.indexOf(commandSet.command) !== -1 ) { //only allow command that list in apiKeys
    if(callback)
      callback(commandSet);
  }
};

const setBBSCmd = (command) => {
  setBBSCmdEx({command: command});
};

const isBBSPage = () => {
  return urlCheck.test(tabs.activeTab.url);
};

exports.setAPICallback = setCallback;
exports.bbsfoxAPI = {setBBSCmdEx: setBBSCmdEx,
                     setBBSCmd: setBBSCmd,
                     isBBSPage: isBBSPage};
