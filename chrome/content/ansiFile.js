function AnsiFile(ansiColor) {
  this.ansi = ansiColor;
  this.listener = ansiColor.listener;
}

AnsiFile.prototype = {
  doPasteFileData: function(data) {
    //TODO: remove clipboard operation, paste data directly
    //FIXME: load file with different charset
    let text = this.ansi.convertStringToUTF8(data);
    //this.ansi.ansiClipboard(text);
    this.ansi.paste(text);
  },

  savePage: function(saveMode) {
    //FIXME: save file with different charset
    let downloadArticle = this.listener.robot.downloadArticle;
    downloadArticle.finishCallback( data => {
      this.saveFile(data, saveMode);
    });
    downloadArticle.startDownloadEx(saveMode);
  },

  openTab: function() {
    let downloadArticle = this.listener.robot.downloadArticle;
    downloadArticle.finishCallback( data => {
      bbsfox.sendCoreCommand({command: "openEasyReadingTab", htmlData: data});
    });
    downloadArticle.startDownloadEx(2);
  },

  loadFile: function() {
    let nsIFilePicker = Ci.nsIFilePicker;
    bbsfox.sendCoreCommand({command: "openFilepicker",
                            title: null,
                            mode: nsIFilePicker.modeOpen,
                            appendFilters: [nsIFilePicker.filterAll],
                            postCommand: "doPasteFileData"});
  },

  saveFile: function(data, saveMode) {
    let nsIFilePicker = Ci.nsIFilePicker;
    let defaultExtension = "";
    let defaultString = "";
    let appendFilters = [];
    let convertUTF8 = false;
    let utf8BOM = false;

    if(saveMode == 0) {
      if(this.listener.prefs.deleteSpaceWhenCopy) {
        data = data.replace(/[ \t\f]+$/gm, "");
      }
      convertUTF8 = true;
      utf8BOM = true;
      defaultExtension = "txt";
      defaultString = "newtext";
      appendFilters.push(nsIFilePicker.filterAll);
    }
    else if(saveMode == 1) {
      defaultExtension = "ans";
      defaultString = "newansi";
      appendFilters.push(nsIFilePicker.filterAll);
    }
    else {//if(saveMode == 2)
      convertUTF8 = true;
      defaultExtension = "html";
      defaultString = "newhtml";
      appendFilters.push(nsIFilePicker.filterHTML);
    }

    bbsfox.sendCoreCommand({command: "openFilepicker",
                            title: null,
                            mode: nsIFilePicker.modeSave,
                            defaultExtension:defaultExtension,
                            defaultString: defaultString,
                            appendFilters: appendFilters,
                            saveData: data,
                            convertUTF8: convertUTF8,
                            utf8BOM: utf8BOM});
  }
};
