function AnsiFile(ansiColor) {
    this.ansi = ansiColor;
    this.listener = ansiColor.listener;
}

AnsiFile.prototype = {
    openFile: function() {
        //FIXME: load file with different charset
        var data = this.loadFile();
        if(!data)
            return;

        var text = this.ansi.convertStringToUTF8(data);
        this.ansi.ansiClipboard(text);
        this.ansi.paste();
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
                _this.openNewTab(data);
            });
            downloadArticle.startDownloadEx(2);
    },

    loadFile: function() {
    	//TODO: need modify for E10S
    	/*
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
                           .createInstance(nsIFilePicker);
        fp.init(window, null, nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterAll);
        if(fp.show() == nsIFilePicker.returnCancel)
            return '';
        if(!fp.file.exists())
            return '';

        var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                                .createInstance(Components.interfaces.nsIFileInputStream);
        // Read data with 2-color DBCS char
        fstream.init(fp.file, -1, -1, false);

        var bstream = Components.classes["@mozilla.org/binaryinputstream;1"]
                      .createInstance(Components.interfaces.nsIBinaryInputStream);
        bstream.setInputStream(fstream);
        var bytes = bstream.readBytes(bstream.available());

        return bytes;
      */
      return [];
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
                              defaultExtension:"html",
                              defaultString: "newhtml",
                              appendFilters: [nsIFilePicker.filterHTML],
                              saveData: data,
                              convertUTF8: convertUTF8});
    },

    openNewTab: function(data) {
    	//TODO: need modify for E10S
    	/*
      var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
      var filetmp = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
      filetmp.append('easyreading.htm');
      filetmp.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
      var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      ostream.init(filetmp, -1, -1, 0);
      var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
      converter.init(ostream, "UTF-8", 0, 0);
      converter.writeString(data);
      converter.flush();
      converter.close();
      var tempURI = ios.newFileURI(filetmp).spec;
      try{
        var win = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
        if(win)
          win.gBrowser.loadOneTab(tempURI, null, 'UTF-8', null, true, false);
        else
          window.open(tempURI);
      }
      catch(e){
      }
      this.listener.tempFiles.push(filetmp);
      */
    }
};
