function AnsiFile(ansiColor) {
    this.ansi = ansiColor;
    this.listener = ansiColor.listener;
}

AnsiFile.prototype = {
    doPasteFileData: function(data) {
        //TODO: remove clipboard operation, paste data directly
        //FIXME: load file with different charset
        var text = this.ansi.convertStringToUTF8(data);
        //this.ansi.ansiClipboard(text);
        this.ansi.paste(text);
    },

    savePage: function(saveMode) {
        //FIXME: save file with different charset
        /*
        if(this.listener.view.selection.hasSelection()) {
            var data = this.ansi.getSelText();
            this.saveFile(data, false);
            if(this.listener.prefs.ClearCopiedSel)
                this.listener.view.selection.cancelSel(true);
        } else {
        */
            //var stringBundle = this.listener.stringBundle;
            //var noColor = confirm(stringBundle.getString("save_without_color"));

            var downloadArticle = this.listener.robot.downloadArticle;
            var _this = this;
            downloadArticle.finishCallback(function(data) {
                //var text = _this.ansi.convertStringToUTF8(data);
                /*
                if(saveMode == 0)
                    _this.ansi.systemClipboard(text);
                else if(saveMode == 1)
                    _this.ansi.ansiClipboard(text);
                */
                _this.saveFile(data, saveMode);
            });
            downloadArticle.startDownloadEx(saveMode);
        //}
    },

    openTab: function() {
    	//TODO: need modify for E10S
      var downloadArticle = this.listener.robot.downloadArticle;
      var _this = this;
      downloadArticle.finishCallback(function(data) {
        //_this.openNewTab(data);
        bbsfox.sendCoreCommand({command: "openEasyReadingTab", htmlData: data});
      });
      downloadArticle.startDownloadEx(2);
    },

    loadFile: function() {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      bbsfox.sendCoreCommand({command: "openFilepicker",
                              title: null,
                              mode: nsIFilePicker.modeOpen,
                              appendFilters: [nsIFilePicker.filterAll],
                              postCommand: "doPasteFileData"});
    },

    saveFile: function(data, saveMode) {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var defaultExtension = '';
      var defaultString = '';
      var appendFilters = [];
      var convertUTF8 = false;

      if(saveMode == 0)
      {
        if(this.listener.prefs.deleteSpaceWhenCopy)
        {
          var strArray;
          if(this.listener.os == 'WINNT')
            strArray = data.split('\r\n');
          else
            strArray = data.split('\n');

          data = '';
          for (var i=0 ;i<strArray.length ;i++)
          {
            data+=strArray[i].replace(/ +$/,"");
            if(i<strArray.length-1)
              data+='\r\n';
          }
        }
        defaultExtension = 'txt';
        defaultString = 'newtext';
        appendFilters.push(nsIFilePicker.filterAll);
      }
      else if(saveMode == 1)
      {
        defaultExtension = 'ans';
        defaultString = 'newansi';
        appendFilters.push(nsIFilePicker.filterAll);
      }
      else
      {
        convertUTF8 = true;
        defaultExtension = 'html';
        defaultString = 'newhtml';
        appendFilters.push(nsIFilePicker.filterHTML);
      }

      bbsfox.sendCoreCommand({command: "openFilepicker",
                              title: null,
                              mode: nsIFilePicker.modeSave,
                              defaultExtension:defaultExtension,
                              defaultString: defaultString,
                              appendFilters: appendFilters,
                              saveData: data,
                              convertUTF8: convertUTF8});
    }
};
