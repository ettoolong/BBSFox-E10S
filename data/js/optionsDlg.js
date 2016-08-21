var self = require('sdk/self');
var data = self.data;
var workers = require('sdk/content/worker');
var tabs = require('sdk/tabs');
var _ = require('sdk/l10n').get;

var optionsDlg = {

  open: function(filePath) {
    if(!this.win) {
      this.win = require('sdk/window/utils').openDialog({
        features: Object.keys({
          minimizable: true,
          chrome: true,
          //toolbar: true,
          titlebar: true,
          alwaysRaised: true,
          centerscreen: true
          //private: true
        }).join() + ',width=740,height=230',
        name: _('openPrefsTab_title')
      });
      this.win.addEventListener('load', function () {
        //tabs.activeTab.on('ready', function (tab) {
        tabs.activeTab.on('load', function (tab) {
          this.worker = tab.attach({
            contentScriptFile: data.url('js/optionsDlg-cs.js')
          });
          this.win.document.title = _('openPrefsTab_title');
          //this.worker.port.emit('setData', {
          //});
        }.bind(this));

        tabs.activeTab.url = filePath;
      }.bind(this), false);
    }
  }
};

exports.optionsDlg = optionsDlg;
