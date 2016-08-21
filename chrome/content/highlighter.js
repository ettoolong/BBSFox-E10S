//reference:
//https://github.com/mozilla-services/services-central-legacy/blob/master/toolkit/content/widgets/findbar.xml

function Highlighter(bbscore) {
  this.nsISelectionController = Ci.nsISelectionController;
  this._findSelection = this.nsISelectionController.SELECTION_FIND;
}

Highlighter.prototype={
  highlight: function (text, caseSensitive) {
    this._highlightDoc(true, text, caseSensitive);
  },

  clean: function () {
    this._highlightDoc(false);
  },

  _getSelectionController: function (aWindow) {
    if (!aWindow.innerWidth || !aWindow.innerHeight)
      return null;

    var docShell = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                          .getInterface(Ci.nsIWebNavigation)
                          .QueryInterface(Ci.nsIDocShell);
    var controller = docShell.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsISelectionDisplay)
                             .QueryInterface(Ci.nsISelectionController);
    return controller;
  },

  _highlightDoc: function (aHighlight, aWord, caseSensitive) {
    var doc = document;
    var textFound = false;

    var controller = this._getSelectionController(window);
    if (!controller) {
      // Without the selection controller,
      // we are unable to (un)highlight any matches
      return textFound;
    }

    if (!doc || !(doc instanceof HTMLDocument))
      return textFound;

    if (aHighlight) {
      var searchRange = doc.createRange();
      searchRange.selectNodeContents(doc.body);
      var startPt = searchRange.cloneRange();
      startPt.collapse(true);
      var endPt = searchRange.cloneRange();
      endPt.collapse(false);
      var retRange = null;
      var finder = Cc["@mozilla.org/embedcomp/rangefind;1"].createInstance()
                   .QueryInterface(Ci.nsIFind);
      finder.caseSensitive = caseSensitive;//this._shouldBeCaseSensitive(aWord);
      while ((retRange = finder.Find(aWord, searchRange, startPt, endPt))) {
        this._highlight(retRange, controller);
        startPt = retRange.cloneRange();
        startPt.collapse(false);
        textFound = true;
      }
    } else {
      // First, attempt to remove highlighting from main document
      var sel = controller.getSelection(this._findSelection);
      sel.removeAllRanges();
      // Next, check our editor cache, for editors belonging to this document
      return true;
    }
    return textFound;
  },

  _highlight: function (aRange, aController) {
    var controller = aController;
    var findSelection = controller.getSelection(this._findSelection);
    findSelection.addRange(aRange);
  }
};
