const { classes: Cc, interfaces: Ci, Constructor: Co, utils: Cu } = Components;

function BBSFoxSiteSetting(opt, siteaddr, sitename, newsite) {
    this.opt = opt;
    this.browserutils = new BBSFoxBrowserUtils();
    this.prefs = this.browserutils.getSubBranch('host_'+siteaddr+'.');
    this.values = [];
    this.sitename = sitename;
    this.siteaddr = siteaddr;

    if(sitename=='')
      this.charsetTest();

    if(!newsite)
      this.getFromPref();
    else
      this.getFromUi();
}

BBSFoxSiteSetting.prototype = {
  getPrefBool: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    this.values[elementId] = this.prefs.getBoolPref(prefName);
  },

  setPrefBool: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    this.prefs.setBoolPref(prefName, this.values[elementId]);
  },

  getPrefInt: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    this.values[elementId] = this.prefs.getIntPref(prefName);
  },

  setPrefInt: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    this.prefs.setIntPref(prefName, this.values[elementId]);
  },

  getPrefComp: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    this.values[elementId] = this.prefs.getComplexValue(prefName, Ci.nsISupportsString).data;
  },

  setPrefComp: function(elementId, prefName) {
    if(!prefName) prefName = elementId;
    var nsIString = Cc["@mozilla.org/supports-string;1"]
                    .createInstance(Ci.nsISupportsString);
    nsIString.data = this.values[elementId];
    this.prefs.setComplexValue(prefName, Ci.nsISupportsString, nsIString);
  },

  getUiBool: function(elementId) {
    this.values[elementId] = document.getElementById(elementId).checked;
  },

  setUiBool: function(elementId) {
    document.getElementById(elementId).checked = this.values[elementId];
  },

  getUiInt: function(elementId) {
    this.values[elementId] = document.getElementById(elementId).value;
  },

  setUiInt: function(elementId) {
    document.getElementById(elementId).value = this.values[elementId];
  },

  getUiComp: function(elementId) {
    this.values[elementId] = document.getElementById(elementId).value;
  },

  setUiComp: function(elementId) {
    document.getElementById(elementId).value = this.values[elementId];
  },

  getUiAccount: function(elementId) {
    this.values[elementId] = document.getElementById(elementId).value;
  },

  setUiAccount: function(elementId) {
    document.getElementById(elementId).value = this.values[elementId];
  },

  getFromUi: function() {
      var opt = this.opt;
      for(var i in opt.valueBool){
        this.getUiBool(opt.valueBool[i]);
      }
      for(var i in opt.valueInt){
        this.getUiInt(opt.valueInt[i]);
      }
      for(var i in opt.valueComp){
        this.getUiComp(opt.valueComp[i]);
      }
      for(var i in opt.valueAccount){
        this.getUiAccount(opt.valueAccount[i]);
      }
  },

  setToUi: function() {
      var opt = this.opt;
      for(var i in opt.valueBool){
        this.setUiBool(opt.valueBool[i]);
      }
      for(var i in opt.valueInt){
        this.setUiInt(opt.valueInt[i]);
      }
      for(var i in opt.valueComp){
        this.setUiComp(opt.valueComp[i]);
      }
      for(var i in opt.valueAccount){
        this.setUiAccount(opt.valueAccount[i]);
      }
      opt.charsetChange();
  },

  getFromPref: function() {
      var opt = this.opt;
      var defaultPref = this.browserutils.getSubBranch('host_default.');
      for(var i in opt.valueBool){
        try{
          this.getPrefBool(opt.valueBool[i]);
        }
        catch(e){
          //read this pref from default and save this value right now !
          this.values[opt.valueBool[i]] = defaultPref.getBoolPref(opt.valueBool[i]);
          this.setPrefBool(opt.valueBool[i]);
        }
      }
      for(var i in opt.valueInt){
        try{
          this.getPrefInt(opt.valueInt[i]);
        }
        catch(e){
          //read this pref from default...
          this.values[opt.valueInt[i]] = defaultPref.getIntPref(opt.valueInt[i]);
          this.setPrefInt(opt.valueInt[i]);
        }
      }
      for(var i in opt.valueComp){
        try{
          this.getPrefComp(opt.valueComp[i]);
        }
        catch(e){
          //read this pref from default...
          this.values[opt.valueComp[i]] = defaultPref.getComplexValue(opt.valueComp[i], Ci.nsISupportsString).data;
          this.setPrefComp(opt.valueComp[i]);
        }
      }
      //load login data - start
      for(var i in opt.loginInfoSet){
        var url = (this.siteaddr == 'default') ? opt.loginInfoSet[i].ds : opt.loginInfoSet[i].ss + this.getFullUrl(this.siteaddr);
        try {
          var logins = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager).findLogins({}, url, opt.loginInfoSet[i].ds, null);
          if(logins.length)
          {
            this.values[opt.loginInfoSet[i].uk] = logins[0]['username'];
            this.values[opt.loginInfoSet[i].pk] = logins[0]['password'];
          }
          else
          {
            this.values[opt.loginInfoSet[i].uk] = '';
            this.values[opt.loginInfoSet[i].pk] = '';
          }
        } catch(e) {
          this.values[opt.loginInfoSet[i].uk] = '';
          this.values[opt.loginInfoSet[i].pk] = '';
        }
      }
      //load login data - end
  },

  setToPref: function() {
      var opt = this.opt;
      for(var i in opt.valueBool){
        this.setPrefBool(opt.valueBool[i]);
      }
      for(var i in opt.valueInt){
        this.setPrefInt(opt.valueInt[i]);
      }
      for(var i in opt.valueComp){
        this.setPrefComp(opt.valueComp[i]);
      }
      if(this.sitename=='')
      {
      }
      else
      {
        this.browserutils.saveSite(this.sitename, this.siteaddr);
      }
      //save login data - start
      this.delLoginData();
      for(var i in opt.loginInfoSet){
        var url = (this.siteaddr == 'default') ? opt.loginInfoSet[i].ds : opt.loginInfoSet[i].ss + this.getFullUrl(this.siteaddr);
        if(this.values[opt.loginInfoSet[i].uk]!='' && this.values[opt.loginInfoSet[i].pk]!='') {
          try {
            var myLoginInfo = new Co("@mozilla.org/login-manager/loginInfo;1",Ci.nsILoginInfo,"init");
            var login = new myLoginInfo(url, opt.loginInfoSet[i].ds, null, this.values[opt.loginInfoSet[i].uk], this.values[opt.loginInfoSet[i].pk], '', '');
            Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager).addLogin(login);
          } catch(e) {}
        }
      }
      //save login data - end
  },

  delLoginData: function() {
    //delete login data - start
    var opt = this.opt;
    for(var i in opt.loginInfoSet){
      var url = (this.siteaddr == 'default') ? opt.loginInfoSet[i].ds : opt.loginInfoSet[i].ss + this.getFullUrl(this.siteaddr);
      try {
        var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
        var logins = loginManager.findLogins({}, url, opt.loginInfoSet[i].ds, null);
        for (var j = 0; j < logins.length; j++)
          loginManager.removeLogin(logins[j]);
      } catch(e) {}
    }
    //delete login data - end
  },

  charsetTest: function() {
    // detect system locale and save to pref
    if(this.prefs.getComplexValue('Charset', Ci.nsISupportsString).data === 'locale') {
      let strBundle = document.getElementById("bbsfoxoptions-string-bundle");
//      var PLStr = Ci.nsIPrefLocalizedString;
      var nsIString = Cc["@mozilla.org/supports-string;1"]
                      .createInstance(Ci.nsISupportsString);
//      nsIString.data = this.browserutils._prefBranch.getComplexValue('locale', PLStr).data;
      nsIString.data = strBundle.getString('extensions.bbsfox2.locale');
      this.prefs.setComplexValue('Charset', Ci.nsISupportsString, nsIString);
    }
  },

  getFullUrl: function(siteaddr) {
    var splits = siteaddr.split(/:/g);
    if(splits.length == 1)
    {
      return siteaddr+':23';
    }
    else if(splits.length == 2)
    {
      return siteaddr;
    }
  }
};

function BBSFoxOptions() {
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  var scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"].getService(Ci.nsIScriptableInputStream);
  var ssm = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
  var sp = ssm.getSystemPrincipal();
  var channel = ioService.newChannel2("chrome://bbsfox/content/prefs.json", //aSpec
                           null, //aOriginCharset
                           null, //aBaseURI
                           null, //aLoadingNode
                           sp, //aLoadingPrincipal
                           null, //aTriggeringPrincipal
                           Ci.nsILoadInfo.SEC_NORMAL, //aSecurityFlags
                           Ci.nsIContentPolicy.TYPE_OTHER); //aContentPolicyType
  var input = channel.open();
  scriptableStream.init(input);
  this.bbsfoxPrefs = JSON.parse( scriptableStream.read(input.available()) );
  scriptableStream.close();
  input.close();

  this.valueBool = [];
  this.valueInt = [];
  this.valueComp = [];
  for(let i in this.bbsfoxPrefs.sitePrefs) {
    let value = this.bbsfoxPrefs.sitePrefs[i];
    if( typeof value === 'boolean') {
      this.valueBool.push(i);
    }
    else if( typeof value === 'number') {
      this.valueInt.push(i);
    }
    else if( typeof value === 'string'){
      this.valueComp.push(i);
    }
  }

  this.valueAccount = ['Login','Passwd','SshUserName','SshPassword'];

  this.loginInfoSet = [{ds:'chrome://bbsfox2', ss:'telnet://', uk:'Login', pk:'Passwd'},
                       {ds:'chrome://bbsfox3', ss:'ssh://', uk:'SshUserName', pk:'SshPassword'}];

  this.browserutils = new BBSFoxBrowserUtils();
  this.prefs = this.browserutils.getSubBranch('host_default.');

  this.allSiteSetting = [];
  this.selectedIndex = 0;
}

BBSFoxOptions.prototype = {

  addSite: function(siteName, siteAddr) {
    var siteList = document.getElementById('siteListEx');
    var row = document.createElement('listitem');
    var cell = document.createElement('listcell');
    cell.setAttribute('label', siteName);
    row.appendChild(cell);

    cell = document.createElement('listcell');
    cell.setAttribute('label', siteAddr);
    row.appendChild(cell);

    siteList.appendChild(row);

    var newsite = new BBSFoxSiteSetting(this, siteAddr, siteName, true);
    this.allSiteSetting.push(newsite);
  },

  delSite: function() {
    var siteList = document.getElementById('siteListEx');
    var siteAddr = siteList.selectedItems[0].childNodes[1].getAttribute('label');
    siteList.removeItemAt(siteList.getIndexOfItem(siteList.selectedItems[0]));

    var temp = [];
    while(this.allSiteSetting.length){
      var site = this.allSiteSetting.shift();
      if(site.siteaddr != siteAddr)
        temp.push(site);
    }

    while(temp.length){
      this.allSiteSetting.push(temp.shift());
    }

    //del file in tmpD - start
    //TmpD / ProfD
    siteAddr = options.getFullUrl(siteAddr);
    var siteAddr2 = siteAddr.replace(/:/g, '~');

    var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
    dstfile.append("_bg."+siteAddr2);
    //if file already exists delete it.
    if(dstfile.exists())
      dstfile.remove(true);
    //del file in tmpD - end
  },

  siteChanged: function() {
    var siteList = document.getElementById('siteListEx');
    if(siteList.selectedItems[0])
    {
    }
    else
    {
      siteList.selectItem(siteList.getItemAtIndex(0));
      return;
    }

    //save prevous page value
    this.allSiteSetting[this.selectedIndex].getFromUi();

    var siteIndex = siteList.getIndexOfItem(siteList.selectedItems[0]);
    this.selectedIndex = siteIndex;

    //load new page value
    document.getElementById('deleteSite').disabled = (siteIndex==0);
    this.allSiteSetting[this.selectedIndex].setToUi();
  },

  onFontChange:function() {
      if(document.getElementById("FontFace.string").value=='')
      {
        document.getElementById("FontTestResult").style.display = 'none';
        return;
      }
      var strBundle = document.getElementById("bbsfoxoptions-string-bundle");
      let spanElem = [];
      let spanWidth = [];
      for(var i = 0; i < 6; ++i) {
        let elem = document.getElementById("FontFaceTest.span" + i);
        spanElem.push(elem);
      }
      var s9 = document.getElementById("FontTestResult");

      var fontface = document.getElementById("FontFace.string").value;
      var idx = fontface.indexOf('(');
      if(idx!=-1)
        fontface = fontface.substring(0,idx);

      if(fontface =='Fixedsys')
      {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult3');
        return;
      }
      for(let elem of spanElem) {
        elem.style.fontFamily = fontface;
        elem.style.fontSize = "48px";
      }
      for(var i = 0; i < spanElem.length; ++i) {
        spanWidth[i] = spanElem[i].offsetWidth;
      }

      if(spanWidth[0] == spanWidth[1] && spanWidth[1] == spanWidth[2] &&
         spanWidth[2] == spanWidth[3] && spanWidth[3] == spanWidth[4] &&
         spanWidth[4] == spanWidth[5]) {
        s9.style.display = 'inline';
        s9.style.color ="#0000FF";
        s9.value = strBundle.getString('fontTestResult1');
      } else if( spanWidth[1] == spanWidth[2] && spanWidth[2] == spanWidth[3] &&
                 spanWidth[3] == spanWidth[4] && spanWidth[4] == spanWidth[5]) {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult4');
      } else if(spanWidth[2] == spanWidth[3] && spanWidth[3] == spanWidth[4] &&
                spanWidth[4] == spanWidth[5]) {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult2');
      } else {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult3');
      }
  },

  onFontEnChange:function() {
      if(document.getElementById("FontFaceEn.string").value=='')
      {
        document.getElementById("FontEnTestResult").style.display = 'none';
        return;
      }
      var strBundle = document.getElementById("bbsfoxoptions-string-bundle");
      var s2 = document.getElementById("FontFaceTest.span2");
      var s3 = document.getElementById("FontFaceTest.span3");
      var s4 = document.getElementById("FontFaceTest.span4");
      var s5 = document.getElementById("FontFaceTest.span5");

      let spanMap = {0:"2", 1:"3", 2:"4", 3:"5"};
      let spanElem = [];
      let spanWidth = [];
      for(var i = 0; i < 4; ++i) {
        let elem = document.getElementById("FontFaceTest.span" + spanMap[i]);
        spanElem.push(elem);
      }
      var s9 = document.getElementById("FontEnTestResult");

      var fontface = document.getElementById("FontFaceEn.string").value;
      var idx = fontface.indexOf('(');
      if(idx!=-1)
        fontface = fontface.substring(0,idx);

      if(fontface =='Fixedsys')
      {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult3');
        return;
      }

      for(let elem of spanElem) {
        elem.style.fontFamily = fontface;
        elem.style.fontSize = "48px";
      }
      for(var i = 0; i < spanElem.length; ++i) {
        spanWidth[i] = spanElem[i].offsetWidth;
      }

      if(spanWidth[0] == spanWidth[1] && spanWidth[1] == spanWidth[2] && spanWidth[2] == spanWidth[3])
      {
        s9.style.display = 'inline';
        s9.style.color ="#0000FF";
        s9.value = strBundle.getString('fontTestResult5');
      }
      else
      {
        s9.style.display = 'inline';
        s9.style.color ="#FF0000";
        s9.value = strBundle.getString('fontTestResult6');
      }
  },

  charsetChange:function() {
    // build font lists
    var lang;
    if(document.getElementById('Charset').value == 'gb2312')
      lang = 'zh-CN';
    else
      lang = 'zh-TW';
    var fontFace = document.getElementById('FontFace.string');
    var fontFaceEn = document.getElementById('FontFaceEn.string');
    FontBuilder.buildFontList(lang, 'monospace', fontFace);
    FontBuilder.buildFontList(lang, 'monospace', fontFaceEn);

    //

    var siteList = document.getElementById('siteListEx');
    var siteIndex = 0;
    if(siteList.selectedItems[0])
      siteIndex = siteList.getIndexOfItem(siteList.selectedItems[0]);

    document.getElementById('FontFace.string').value = this.allSiteSetting[siteIndex].values['FontFace.string'];
    document.getElementById('FontFaceEn.string').value = this.allSiteSetting[siteIndex].values['FontFaceEn.string'];
  },

  load: function() {
    //load default setting.
    var siteAddrList = this.browserutils.getSiteAddrList();
    var subBranch = 'default';
    var defaultSiteSetting = new BBSFoxSiteSetting(this, subBranch, '', false);
    this.allSiteSetting.push(defaultSiteSetting);

    var siteList = document.getElementById('siteListEx');
    var CiStr = Ci.nsISupportsString;
    for(var i=0; i<siteAddrList.length; ++i)
    {
      var row = document.createElement('listitem');
      var cell = document.createElement('listcell');
      var sitename = this.browserutils.getSubBranch('host_' + siteAddrList[i]+'.').getComplexValue('sitename', CiStr).data;
      cell.setAttribute('label', sitename);
      row.appendChild(cell);

      cell = document.createElement('listcell');
      cell.setAttribute('label', siteAddrList[i]);
      row.appendChild(cell);

      siteList.appendChild(row);
      var othersite = new BBSFoxSiteSetting(this, siteAddrList[i], sitename, false);
      this.allSiteSetting.push(othersite);
    }
    defaultSiteSetting.setToUi();
  },

  applyLastSelSite: function() {
    var siteList = document.getElementById('siteListEx');
    var siteIndex = 0;
    if(siteList.selectedItems[0])
      siteIndex = siteList.getIndexOfItem(siteList.selectedItems[0]);
    this.allSiteSetting[siteIndex].getFromUi();
  },

  save: function() {
    for(var i in this.allSiteSetting){
      //copy file from tmpD to profD - start
      //TmpD / ProfD
      var insLocation = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
      var siteAddr = (i == 0 ? "default" : this.getFullUrl(this.allSiteSetting[i].siteaddr));
      var siteAddr2 = siteAddr.replace(/:/g, '~');
      var dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      if (!dir) return;

      var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
      var srcfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
      srcfile.append("_bg."+siteAddr2);
      dstfile.append("bbsfoxBg");
      dir.initWithPath(dstfile.path);

      if (!dstfile.exists() || !dstfile.isDirectory()) {
        // read and write permissions to owner and group, read-only for others.
        dstfile.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
      }
      dstfile.append("_bg."+siteAddr2);

      if(srcfile.exists())
      {
        //if file already exists delete it.
        if(dstfile.exists())
          dstfile.remove(true);
        srcfile.copyTo(dir, "_bg."+siteAddr2);
        srcfile.remove(true);
      }
      //copy file from tmpD to profD - end
      this.allSiteSetting[i].setToPref();
    }
  },

  cancel: function() {

    //del file in tmpD - start
    for(var i in this.allSiteSetting){
      var siteAddr = (i == 0 ? "default" : this.getFullUrl(this.allSiteSetting[i].siteaddr));
      var siteAddr2 = siteAddr.replace(/:/g, '~');

      var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
      dstfile.append("_bg."+siteAddr2);
      //if file already exists delete it.
      if(dstfile.exists())
        dstfile.remove(true);
    }
    //del file in tmpD - end
  },

  setDefault: function() {
    //set all ui item to default value.
    for(let i in options.bbsfoxPrefs.sitePrefs) {
      let value = options.bbsfoxPrefs.sitePrefs[i];
      item = document.getElementById(i);
      if( typeof value === 'boolean') {
        item.checked = value;
      }
      else {
        item.value = value;
      }
    }

    this.charsetChange();
  },

  backup: function() {
    //  For reviewer:
    //  backup function - save all bbsfox preferences to sqlite file
    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, null, nsIFilePicker.modeSave);
    fp.appendFilter("SQLite", "*.sqlite");
    fp.defaultString = "BBSFox_Backup.sqlite";
    //if (fp.show() == fp.returnCancel || !fp.file) return;
    fp.open( result => {
      if(result != fp.returnCancel && fp.file) {

        var file = fp.file.QueryInterface(Ci.nsIFile);
        //if file already exists delete it.
        if(file.exists())
          file.remove(true);

        var dbSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
        var dbConn = dbSvc.openDatabase(file);

        if (!dbConn.tableExists("bbsfox_Setting_str_table"))
          dbConn.createTable("bbsfox_Setting_str_table", "key TEXT, value TEXT");
        if (!dbConn.tableExists("bbsfox_Setting_int_table"))
          dbConn.createTable("bbsfox_Setting_int_table", "key TEXT, value INTEGER");
        if (!dbConn.tableExists("bbsfox_Setting_bool_table"))
          dbConn.createTable("bbsfox_Setting_bool_table", "key TEXT, value INTEGER");
        if (!dbConn.tableExists("bbsfox_Setting_picture_table"))
          dbConn.createTable("bbsfox_Setting_picture_table", "md5 TEXT, file BLOB");

        var branch = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.bbsfox2.");
        var prefIDs = branch.getChildList("", { });
        var CiStr = Ci.nsISupportsString;
        var stmt;
        var params;

        stmt = dbConn.createAsyncStatement("INSERT INTO bbsfox_Setting_str_table (key, value) VALUES (?,?)");
        params = stmt.newBindingParamsArray();
        for(var i=0; i<prefIDs.length; ++i) {
          var vtype = branch.getPrefType(prefIDs[i]);
          if(vtype == Ci.nsIPrefBranch.PREF_STRING)
          {
            var row_params = params.newBindingParams();
            row_params.bindByIndex(0, prefIDs[i]);
            row_params.bindByIndex(1, branch.getComplexValue(prefIDs[i], CiStr).data);
            params.addParams(row_params);
          }
        }
        stmt.bindParameters(params);
        try {
          stmt.executeAsync();
        }
        catch(ex) {}
        finally { stmt.finalize(); }

        stmt = dbConn.createAsyncStatement("INSERT INTO bbsfox_Setting_int_table (key, value) VALUES(?,?)");
        params = stmt.newBindingParamsArray();
        for(var i=0; i<prefIDs.length; ++i) {
          var vtype = branch.getPrefType(prefIDs[i]);
          if(vtype == Ci.nsIPrefBranch.PREF_INT)
          {
            var row_params = params.newBindingParams();
            row_params.bindByIndex(0, prefIDs[i]);
            row_params.bindByIndex(1, branch.getIntPref(prefIDs[i]));
            params.addParams(row_params);
          }
        }
        stmt.bindParameters(params);
        try {
          stmt.executeAsync();
        }
        catch(ex) {}
        finally { stmt.finalize(); }

        stmt = dbConn.createAsyncStatement("INSERT INTO bbsfox_Setting_bool_table (key, value) VALUES(?,?)");
        params = stmt.newBindingParamsArray();
        for(var i=0; i<prefIDs.length; ++i) {
          var vtype = branch.getPrefType(prefIDs[i]);
          if(vtype == Ci.nsIPrefBranch.PREF_BOOL)
          {
            var row_params = params.newBindingParams();
            row_params.bindByIndex(0, prefIDs[i]);
            row_params.bindByIndex(1, branch.getBoolPref(prefIDs[i]) ? 1 : 0);
            params.addParams(row_params);
          }
        }
        stmt.bindParameters(params);
        try {
          stmt.executeAsync({
            handleResult: function (aResultSet) {},
            handleError: function(){},
            handleCompletion: function(){}
          });
        }
        catch(ex) {}
        finally { stmt.finalize(); }

        //try to save background picture - start
        stmt = dbConn.createAsyncStatement("INSERT INTO bbsfox_Setting_picture_table (md5, file) VALUES(?,?)");
        params = stmt.newBindingParamsArray();
        var allAddrList = this.browserutils.getSiteAddrList();
        for(var i=0;i<allAddrList.length;++i)
           this.backupbgfile(branch, dbConn, params, allAddrList[i]);
        this.backupbgfile(branch, dbConn, params, "default");
        stmt.bindParameters(params);
        try {
          stmt.executeAsync();
        }
        catch(ex) {}
        finally {stmt.finalize(); }
        //try to save background picture - end

        //dbConn.commitTransaction();
        if(dbConn)
        {
          dbConn.asyncClose();
        }
      }
    });
  },

  backupbgfile: function(branch, dbConn, params, site) {
    var CiStr = Ci.nsISupportsString;
    var type = branch.getIntPref("host_"+site+".BackgroundType"); //check site background setting
    if(type!=0)
    {
      var md5 = branch.getComplexValue("host_"+site+".BackgroundImageMD5", CiStr).data;
      if(md5!="")
      {
        var dir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
        var file = dir.get("ProfD", Ci.nsIFile);
        var site2 = site == 'default' ? site : this.getFullUrl(site);
        site2 = site2.replace(/:/g, '~');
        file.append("bbsfoxBg");
        file.append("_bg."+site2);

        if(file.exists())
        {
          var fileStream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
          fileStream.init(file, 1, 0, false);
          var binaryStream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream);
          binaryStream.setInputStream(fileStream);
          var picdataArray = binaryStream.readByteArray(fileStream.available());
          binaryStream.close();
          fileStream.close();

          var row_params = params.newBindingParams();
          row_params.bindByIndex(0, md5);
          row_params.bindBlobByIndex(1, picdataArray, picdataArray.length);
          params.addParams(row_params);
        }
        else {
          //console.log('NOT found file _bg.'+site2);
        }
      }
    }
  },

  recover: function() {
    //  For reviewer:
    //  recover function - load all bbsfox preferences from sqlite file
    let branch = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.bbsfox2.");
    let jobCount = 0;
    let dbConn = null;
    let newlist = [];

    let handleCompletion = () => {
      jobCount++;
      if(jobCount === 3) {
        //try to recover background picture - start
        let allAddrList = this.browserutils.getSiteAddrList();
        for(let addr of allAddrList)
          this.recoverbgfile(branch, dbConn, addr);
        this.recoverbgfile(branch, dbConn, "default");
        //try to recover background picture - end
        if(dbConn ) {
          // Close connection once the pending operations are completed
          dbConn.asyncClose({
            complete: () => {
              this.checkPref(newlist);
              this.notifyPage();
              //close setting page - start
              let win = document.getElementById('bbsfoxOption');
              win.cancelDialog();
              //close setting page - end
            }
          });
          dbConn = null;
        }
      }
    };
    let nsIFilePicker = Ci.nsIFilePicker;
    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, null, nsIFilePicker.modeOpen);
    fp.appendFilter("SQLite", "*.sqlite");
    //if (fp.show() == fp.returnCancel || !fp.file) return false;

    fp.open(result => {
      if(result != fp.returnCancel && fp.file) {

        var strBundle = document.getElementById("bbsfoxoptions-string-bundle");
        var message = strBundle.getString('recoverwarning');
        var promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
        if (!promptSvc.confirm(window, "BBSFox", message)) return;

        if(!fp.file.exists()) return false;

        var dbSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
        dbConn = dbSvc.openDatabase(fp.file);
        var nsIString = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        var CiStr = Ci.nsISupportsString;
        var hostregex = /^hostlist_(.{1,})/i;

        var stmt = dbConn.createAsyncStatement("SELECT * FROM 'bbsfox_Setting_str_table'");
        try {
          stmt.executeAsync({
            handleResult: aResultSet => {
              var row;
              while (row = aResultSet.getNextRow()) {
                var key = row.getResultByIndex(0);
                nsIString.data = row.getResultByIndex(1);
                branch.setComplexValue(key, Ci.nsISupportsString, nsIString);
              }
            },
            handleError: () => {handleCompletion();},
            handleCompletion: () => {handleCompletion();}
          });
        }
        finally {stmt.finalize(); }

        stmt = dbConn.createAsyncStatement("SELECT * FROM 'bbsfox_Setting_int_table'");
        try {
          stmt.executeAsync({
            handleResult: aResultSet => {
              var row;
              while (row = aResultSet.getNextRow()) {
                var key = row.getResultByIndex(0);
                var value = row.getResultByIndex(1);
                branch.setIntPref(key, value);
              }
            },
            handleError: () => {handleCompletion();},
            handleCompletion: () => {handleCompletion();}
          });
        }
        finally {stmt.finalize(); }

        stmt = dbConn.createAsyncStatement("SELECT * FROM 'bbsfox_Setting_bool_table'");
        try {
          stmt.executeAsync({
            handleResult: aResultSet => {
              var row;
              while (row = aResultSet.getNextRow()) {
                var key = row.getResultByIndex(0);
                var value = row.getResultByIndex(1)==0 ? false : true;
                branch.setBoolPref(key, value);
                //if key is hostlist_ , add to hostlist...
                if(hostregex.test(key))
                {
                  var splits = key.split(hostregex);
                  newlist.push(splits[1]);
                }
              }
            },
            handleError: () => {handleCompletion();},
            handleCompletion: () => {handleCompletion();}
          });
        }
        finally {stmt.finalize(); }
      }
    });
    return true;
  },

  recoverbgfile: function(branch, dbConn, site) {
    var CiStr = Ci.nsISupportsString;
    var type = branch.getIntPref("host_"+site+".BackgroundType");
    if(type!=0)
    {
      var md5 = branch.getComplexValue("host_"+site+".BackgroundImageMD5", CiStr).data;
      if(md5!="")
      {
        //try to find same md5 from database.
        stmt = dbConn.createAsyncStatement("SELECT * FROM 'bbsfox_Setting_picture_table'");
        //var dataSize = { value: 0 };
        //var data = { value: null };
        try {
          stmt.executeAsync({
            handleResult: aResultSet => {
              var row;
              while (row = aResultSet.getNextRow()) {
                var key = row.getResultByIndex(0);
                if(key==md5) {
                  var value = row.getResultByIndex(1);
                  if(value.length) {
                    var dir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
                    var file = dir.get("ProfD", Ci.nsIFile);
                    var site2 = (site == 'default') ? site : this.getFullUrl(site);
                    site2 = site2.replace(/:/g, '~');
                    file.append("bbsfoxBg");
                    if (!file.exists() || !file.isDirectory()) {
                      // read and write permissions to owner and group, read-only for others.
                      file.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
                    }
                    file.append("_bg."+site2);
                    if(file.exists()) {
                      file.remove(true);
                    }
                    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
                    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
                    var bostream = Cc['@mozilla.org/binaryoutputstream;1'].createInstance(Ci.nsIBinaryOutputStream);
                    bostream.setOutputStream(foStream);
                    bostream.writeByteArray(value, value.length);

                    bostream.close();
                    foStream.close();
                  }
                }
              }
            },
            handleError: function(){},
            handleCompletion: function(){
              //
            }
          });
        }
        finally {stmt.finalize(); }
      }
    }
  },

  getFullUrl: function(siteaddr) {
    var splits = siteaddr.split(/:/g);
    if(splits.length == 1) {
      return siteaddr+':23';
    }
    else if(splits.length == 2) {
      return siteaddr;
    }
  },

  checkPref: function(newlist) {
    //if we can't find site from list, we must delete site pref...
    var siteList = document.getElementById('siteListEx');
    var nowSiteAddrList = this.browserutils.getSiteAddrList();
    for(var j=0;j<nowSiteAddrList.length;++j)
    {
      var findflag = false;
      if(newlist)
      {
        for(var i=0;i<newlist.length;++i)
        {
          if(newlist[i]==nowSiteAddrList[j]) //found !
          {
            findflag = true;
            break;
          }
        }
      }
      else
      {
        for(var i=1;i<siteList.itemCount;++i)
        {
          var listitem = siteList.getItemAtIndex(i);
          var siteAddr = listitem.childNodes[1].getAttribute('label');
          if(siteAddr==nowSiteAddrList[j]) //found !
          {
            findflag = true;
            break;
          }
        }
      }
      if(!findflag)
      {
        //delete saved login data - start
        for(var i in this.loginInfoSet){
          var url = this.loginInfoSet[i].ss + this.getFullUrl(nowSiteAddrList[j]);
          try {
            var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
            var logins = loginManager.findLogins({}, url, this.loginInfoSet[i].ds, null);
            for (var k = 0; k < logins.length; k++)
              loginManager.removeLogin(logins[k]);
          } catch(e) {}
        }
        //delete saved login data - end

        this.browserutils.deleteSitePref(nowSiteAddrList[j]);

        //delet background image file - start
        var siteAddr2 = this.getFullUrl(nowSiteAddrList[j]).replace(/:/g, '~');
        var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        dstfile.append("_bg."+siteAddr2);
        if(dstfile.exists())
          dstfile.remove(true);
        //delet background image file - end
      }
    }

  },

  notifyPage: function() {
    //notify page to check pref...
    Cc["@mozilla.org/globalmessagemanager;1"]
      .getService(Ci.nsIMessageBroadcaster)
      .broadcastAsyncMessage("bbsfox@ettoolong:bbsfox-overlayCommand", {command:"checkPrefExist"});
  }
};
//
function load() {
  if(document.location.href == "about:bbsfox") {
    document.getElementById('mainbox').style.overflow="auto";
  }
  options = new BBSFoxOptions();
  options.load();

  var OS = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
  var as = Cc["@mozilla.org/alerts-service;1"];
  var service;
  try
  {
    service = as.getService(Ci.nsIAlertsService);
  }
  catch(error)
  {
    service = null;
    if(OS=='Darwin')
    {
      document.getElementById('AlarmServiceTest1').hidden=false;
      document.getElementById('AlarmServiceTest2').hidden=false;
      document.getElementById('AlarmServiceTest3').hidden=false;
    }
  }
  if(OS=='Darwin') {
    document.getElementById('Hokey2ForPaste').hidden=true;
    document.getElementById('HotkeyCtrlWSet').hidden=true;
    document.getElementById('HotkeyCtrlBSet').hidden=true;
    document.getElementById('HotkeyCtrlLSet').hidden=true;
    document.getElementById('HotkeyCtrlTSet').hidden=true;
  }
    document.getElementById('Hokey2ForPaste').hidden=true;
  //document.getElementById('textspan').hidden=true;
  //document.getElementById('textedit').hidden=true;

  try {
    // Firefox 4 and later; Mozilla 2 and later
    Cu.import("resource://gre/modules/AddonManager.jsm");
    AddonManager.getAddonByID("@popup-video", addon => {
      if(!addon) {
        document.getElementById('InstallPopupVideo').hidden=false;
      }
    });
  } catch(ex){}

  var firegestureSrv = Cc["@xuldev.org/firegestures/service;1"];
  if(!firegestureSrv)
  {
    document.getElementById('FireGesturesOption').disabled=true;
    document.getElementById('FireGesturesScript').disabled=false;
    document.getElementById('bbsScript').disabled=true;
    document.getElementById('httpScript').disabled=true;
    document.getElementById('createScript').disabled=true;
    document.getElementById('FireGesturesTest').hidden=false;
    document.getElementById('FireGesturesScript').hidden=false;
  }
  var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.bbsfox2.");
  var prefsEx = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.bbsfox1.");
  var isDevVersion = prefs.getBoolPref('DevVersion');
  if(isDevVersion)
  {
    var devItems =['PushThreadGesture','OpenThreadUrlGesture',
                   'LoadUrlInBG','PushThreadMenuOpt',
                   'OpenThreadUrlMenuOpt','PushThreadLineLengthSet','NotifyShowContent',
                   'HokeyOpenThreadUrlOpt','FixUnicodeDisplay','resolution',
                   'DetectAid','blacklistid','ColorDefine','EnFontSetting',
                   'FontEnTestResult'];

    for(var i=0;i<devItems.length;++i) {
      document.getElementById(devItems[i]).hidden=false;
    }
  }
  var enableSshSupport = prefsEx.getBoolPref('SshSupport');
  if(enableSshSupport)
  {
    document.getElementById('SshProtocol').hidden=false;
  }

  options.onFontChange();
  options.onFontEnChange();
  alertActionChange();
}

function siteChanged() { options.siteChanged();alertActionChange();}

function save() { options.applyLastSelSite(), options.checkPref(); options.save(); options.notifyPage();}
function cancel() { options.cancel();}
function onSetDefaultClick() { options.setDefault();}
function backup() { options.backup();}
function recover() { options.recover();}

function onSelectBGImage()
{
  var nsIFilePicker = Ci.nsIFilePicker;
  var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(window, null, nsIFilePicker.modeOpen);
  fp.appendFilters(nsIFilePicker.filterImages);
  //if (fp.show() == nsIFilePicker.returnCancel) return;

  fp.open( result => {
    if(result != fp.returnCancel && fp.file) {

      if(!fp.file.exists()) return;

      //TmpD / ProfD
      var insLocation = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
      var siteList = document.getElementById('siteListEx');
      var siteIndex = siteList.getIndexOfItem(siteList.selectedItems[0]);
      var siteAddr = siteIndex==0 ? 'default' : options.getFullUrl(siteList.selectedItems[0].childNodes[1].getAttribute('label'));
      var siteAddr2 = siteAddr.replace(/:/g, '~');
      var dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      if (!dir) return;
      dir.initWithPath(insLocation.path);

      //if file already exists delete it.
      var dstfile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
      dstfile.append("_bg."+siteAddr2);
      if(dstfile.exists())
        dstfile.remove(true);

      fp.file.copyTo(dir, "_bg."+siteAddr2);

      var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
      istream.init(fp.file, 0x01, 0444, 0);
      var ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
      ch.init(ch.MD5);
      const PR_UINT32_MAX = 0xffffffff;
      ch.updateFromStream(istream, PR_UINT32_MAX);
      var hash = ch.finish(false);
      //var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
      var s = '';
      for(var i=0;i<hash.length;++i){
        s+=toHexString(hash.charCodeAt(i));
      }
      //save md5 value, we reload background image when this value be change.
      var textEdit = document.getElementById('BackgroundImageMD5');
      textEdit.value = s;
      istream.close();
    }
  });
}

function onSelectPrivateKey()
{
}

function toHexString(charCode)
{
  return ("0" + charCode.toString(16)).slice(-2);
}

function addSite() {
  const EMURL = "chrome://bbsfox/content/addSite.xul";
  const EMFEATURES = "chrome, dialog=yes, resizable=no, modal=yes, centerscreen";
  var retVals = { sitename: null, siteaddr: null };
  var existSite = [];
  var siteList = document.getElementById('siteListEx');

  for(var i=1;i<siteList.itemCount;++i)
  {
    var listitem = siteList.getItemAtIndex(i);
    var addrtemp = listitem.childNodes[1].getAttribute('label');
    var splits = addrtemp.split(/:/g);
    if(splits.length == 1)
    {
      existSite.push(splits[0]);
      existSite.push(splits[0]+':23');
    }
    else if(splits.length == 2)
    {
      if(splits[1]=='23')
      {
        existSite.push(splits[0]);
        existSite.push(splits[0]+':23');
      }
      else
      {
        existSite.push(addrtemp);
      }
    }
  }

  window.openDialog(EMURL, "", EMFEATURES, retVals, existSite);
  if(retVals.sitename && retVals.siteaddr )
  {
    options.addSite(retVals.sitename, retVals.siteaddr);
  }
  else
  {
  }

}

function delSite() {
  var siteList = document.getElementById('siteListEx');
  var sn = siteList.selectedItems[0].childNodes[0].getAttribute('label');

  var strBundle = document.getElementById("bbsfoxoptions-string-bundle");
  var message = strBundle.getFormattedString('delsitewarning',[sn]);
  var wintitle = strBundle.getString('delsitetitle');
  var promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
  if (!promptSvc.confirm(window, wintitle, message))
    return;
  options.delSite();
}

function charsetChange() { options.charsetChange();}
function onFontChange() { options.onFontChange();}
function onFontEnChange() { options.onFontEnChange();}
function onLineSupport(){openURL('http://forum.moztw.org/viewtopic.php?f=11&t=30217');}
function onLineSupport2(){openURL('http://forum.moztw.org/viewtopic.php?f=11&t=31697');}
function openURL(aURL){
  var win = Cc["@mozilla.org/appshell/window-mediator;1"]
           .getService(Ci.nsIWindowMediator)
           .getMostRecentWindow("navigator:browser");
  if (win)
    win.gBrowser.loadOneTab(aURL, null, null, null, false, false);
  else
    window.open(aURL);
}

function fireGesturesScript(){
  openURL('https://addons.mozilla.org/zh-TW/firefox/addon/firegestures/');
}

function getPopupVideoAddon(){
  openURL('https://addons.mozilla.org/zh-TW/firefox/addon/popup-video/');
}

function fireGesturesOption(){
  var firegestureSrv = Cc["@xuldev.org/firegestures/service;1"];
  if(firegestureSrv)
  {
    var gestureSvc = firegestureSrv.getService(Ci.xdIGestureService);
    if(gestureSvc)
    {
      var gestureMapping = gestureSvc.getMappingForBrowser();
      if(gestureMapping)
        gestureMapping.configure();
    }
  }
}

function alertActionChange()
{
  var v = document.getElementById('ClickAlertAction').value;
  if(v == 2)
  {
    document.getElementById('LableAlertReplyString').hidden=false;
    document.getElementById('AlertReplyString').hidden=false;
  }
  else
  {
    document.getElementById('LableAlertReplyString').hidden=true;
    document.getElementById('AlertReplyString').hidden=true;
  }
}

function checkSelect()
{
  if(document.getElementById('bbsScript').value == 'SendString')
  {
    document.getElementById('textspan2').hidden=true;
    document.getElementById('textedit2').hidden=true;
    document.getElementById('textspan3').hidden=true;
    document.getElementById('textedit3').hidden=true;
    document.getElementById('textspan').hidden=false;
    document.getElementById('textedit').hidden=false;
    document.getElementById('textedit').focus();
    document.getElementById('textedit').value = '';
  }
  else if(document.getElementById('bbsScript').value == 'Searchselstring')
  {
    document.getElementById('textspan').hidden=true;
    document.getElementById('textedit').hidden=true;
    document.getElementById('textspan2').hidden=false;
    document.getElementById('textedit2').hidden=false;
    document.getElementById('textspan3').hidden=false;
    document.getElementById('textedit3').hidden=false;
    document.getElementById('textedit2').value = '';
    document.getElementById('textedit3').value = '';
    document.getElementById('textedit2').focus();
  }
  else
  {
    document.getElementById('textspan2').hidden=true;
    document.getElementById('textedit2').hidden=true;
    document.getElementById('textspan3').hidden=true;
    document.getElementById('textedit3').hidden=true;
    document.getElementById('textspan').hidden=true;
    document.getElementById('textedit').hidden=true;
    document.getElementById('textedit').value = '';
  }
  var elem = document.getElementById('scriptLink');
  while (elem.firstChild) elem.removeChild(elem.firstChild);
  elem.style.display = 'none';
  document.getElementById('note').style.display = 'none';
  document.getElementById('scriptText').value = '';
  //document.getElementById('scriptText').hidden = true;
  document.getElementById('copyScript').disabled = true;
}

function checkSelect2()
{
  var elem = document.getElementById('scriptLink');
  while (elem.firstChild) elem.removeChild(elem.firstChild);
  document.getElementById('note').style.display = 'none';
}

function copyScript()
{
  var clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
  var elem = document.getElementById('scriptText');
  clipboardHelper.copyString(elem.value);
}

function createScript()
{
  var scriptData = '';
  var cmdstr = '';
  //var selindex = document.getElementById('bbsScript').selectedIndex;
  //var selvalue = document.getElementById('bbsScriptopt'+selindex).value;
  var httpstr = document.getElementById('httpScript').selectedItem.label;
  var bbsstr = document.getElementById('bbsScript').selectedItem.label;
  //var resetFocus = document.getElementById('bbsScript').selectedItem.getAttribute("resetFocus");
  //if(resetFocus=='false') {
  //  cmdstr+='  var eventStatus = BBSFox_API.getEventStatus();\r';
  //  cmdstr+='  if(eventStatus) eventStatus.resetFocus = false;\r';
  //}

  if(document.getElementById('bbsScript').value == 'OpenPictureViewer')
  {
    cmdstr+='  var srcNode = FireGestures.sourceNode;\r';
    cmdstr+='  var url = FireGestures.getLinkURL(srcNode);\r';
    cmdstr+='  if(url){\r';
    cmdstr+='    BBSFox_API.setBBSCmd("checkFireGestureKey");\r';
    cmdstr+='    BBSFox_API.setBBSCmdEx({command:"previewPicture", pictureUrl:url});\r';
    cmdstr+='  } else {\r';
    cmdstr+='    throw FireGestures._getLocaleString("ERROR_NOT_ON_LINK");\r';
    cmdstr+='  }\r';
  }
  else if(document.getElementById('bbsScript').value == 'SendString')
  {
    cmdstr+='  BBSFox_API.setBBSCmd("checkFireGestureKey");\r';
    cmdstr+='  BBSFox_API.setBBSCmdEx({command:"sendCodeStr", codeStr:"' + document.getElementById('textedit').value + '"});\r';
  }
  // else if(document.getElementById('bbsScript').value == 'SearchSelString')
  // {
  //   cmdstr+='  BBSFox_API.setBBSCmd("checkFireGestureKey");\r';
  //   cmdstr+='  BBSFox_API.setBBSCmdEx({command:"sendCodeStrEx", codeStr:"' + document.getElementById('textedit2').value + '"});\r';
  //   cmdstr+='  BBSFox_API.setBBSCmdEx({command:"sendCodeStrEx", codeStr2:"' + document.getElementById('textedit3').value + '"});\r';
  // }
  else
  {
    cmdstr+='  BBSFox_API.setBBSCmd("checkFireGestureKey");\r';
    cmdstr+='  ' + document.getElementById('bbsScript').value + '\r';
  }
  var bbsscript0 = document.getElementById('textspan4').value;
  var bbsscript1 = document.getElementById('textspan5').value;
  var elem = document.getElementById('scriptLink');
  while (elem.firstChild) elem.removeChild(elem.firstChild);
  var scriptCaption = '';
  if(document.getElementById('httpScript').value!='')
    scriptCaption = httpstr+bbsscript0+bbsstr;
  else
    scriptCaption = bbsscript1+bbsstr;
  var newtext = document.createTextNode(scriptCaption);
  elem.appendChild(newtext);
  elem = document.getElementById('scriptText');
  elem.value = '//' + scriptCaption+ '\r';
  {
    scriptData+='if(gBrowser.mCurrentTab.eventPrefs){\r'; //TODO: need fix this!
    scriptData+=cmdstr;
    scriptData+='  return;\r';
    scriptData+='}';
  }

  let httpCmd = document.getElementById('httpScript').value;
  if(httpCmd != '')
  {
    if(/^httpcmd:/.test(httpCmd)) {
      let cmd = /^httpcmd:(.*)/.exec(httpCmd);
      cmd = cmd[1];
      scriptData+='\r';
      scriptData+=cmd;
    } else {
      scriptData+='\r';
      scriptData+='FireGestures._performAction(event, "';
      scriptData+=httpCmd;
      scriptData+='");';
    }
  }
  elem = document.getElementById('scriptText');
  elem.value = elem.value + scriptData;
  //elem.hidden = false;
  elem = document.getElementById('copyScript');
  elem.disabled = false;
  scriptData = escape(scriptData);
  elem = document.getElementById('scriptLink');
  elem.setAttribute('hrefdata', 'data:text/javascript,' + scriptData);
  elem.style.display = 'block';
  document.getElementById('note').style.display = 'block';
}
