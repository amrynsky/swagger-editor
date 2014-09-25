'use strict';

/*
 * Manages the AST representation of the specs for fold status
 * and other meta information about the specs tree
*/
PhonicsApp.service('ASTManager', function ASTManager(Editor) {
  var ast = null;
  var changeListeners = [];

  Editor.ready(renewAST);

  /*
  ** Update ast with changes from editor
  */
  function refreshAST() {
    _.defaults(yaml2.ast(Editor.getValue()), ast);
    emitChanges();
  }

  /*
  ** Flush AST and put new value in it
  */
  function renewAST(value) {
    value = value || Editor.getValue();
    if (angular.isString(value)) {
      ast = yaml2.ast(value);
      emitChanges();
    }
  }

  /*
  ** Let event listeners know there was a change in fold status
  */
  function emitChanges() {
    changeListeners.forEach(function (fn) {
      fn();
    });
  }

  function extendSpecs(specs) {
    renewAST(specs);
    return ast;
  }

  /*
  ** Walk the ast for a given path
  */
  function walk(path, current) {
    current = ast;

    if (!Array.isArray(path) || !path.length) {
      throw new Error('Need path for fold in the AST');
    }

    while (path.length) {
      if (!current || !current.subFolds) {
        return null;
      }
      current = current.subFolds[path.shift()];
    }

    return current;
  }

  /*
  ** Beneath first search for the fold that has the same start
  */
  function scan(current, start) {
    var result = null;
    var node, fold;

    if (current.start === start) {
      return current;
    }

    if (angular.isObject(current.subFolds)) {
      for (var k in current.subFolds) {
        if (angular.isObject(current.subFolds)) {
          node = current.subFolds[k];
          fold = scan(node, start);
          if (fold) {
            result = fold;
          }
        }
      }
    }

    return result;
  }
  /*
   * return back line number of an specific node with given path
  */
  function lineForPath (path) {
    var node = walk(path);

    if (node) {
      return node.start.row;
    }
    return null;
  }

  /*
  ** Listen to fold changes in editor and reflect it in ast
  */
  Editor.onFoldChanged(function (change) {
    var row = change.data.start.row;
    var folded = change.action !== 'remove';
    var fold = scan(ast, row);

    if (fold) {
      fold.folded = folded;
    }

    refreshAST();
    emitChanges();
  });

  /*
  ** Toggle a fold status and reflect it in the editor
  */
  this.toggleFold = function () {
    var keys = [].slice.call(arguments, 0);
    var fold = walk(keys);

    if (fold.folded) {
      Editor.removeFold(fold.start + 1);
      fold.folded = false;
    } else {
      Editor.addFold(fold.start, fold.end);
      fold.folded = true;
    }

    refreshAST();
  };

  /*
  ** Return status of a fold with given path parameters
  */
  this.isFolded = function () {
    var keys = [].slice.call(arguments, 0);
    var fold = walk(keys);

    return fold && fold.folded;
  };

  /*
  ** Fold status change listener installer
  */
  this.onFoldStatusChanged = function (fn) {
    changeListeners.push(fn);
  };

  // Expose the methods externally
  this.reset = renewAST;
  this.refresh = refreshAST;
  this.extendSpecs = extendSpecs;
  this.lineForPath = lineForPath;
});
