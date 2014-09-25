'use strict';

PhonicsApp.controller('PreviewCtrl', function PreviewCtrl(Storage, Builder, ASTManager, Editor, Sorter, Operation, BackendHealthCheck, $scope) {
  function update(latest) {

    // If backend is not healthy don't update
    if (!BackendHealthCheck.isHealthy()) {
      return;
    }

    var result = Builder.buildDocs(latest, { resolve: true });
    $scope.specs = Sorter.sort(result.specs);

    if (result.error) {
      if (result.error.yamlError) {
        Editor.annotateYAMLErrors(result.error.yamlError);
      }
      $scope.error = result.error;
      Storage.save('progress', -1); // Error
    } else {
      $scope.error = null;
      Editor.clearAnnotation();
      Storage.save('progress',  1); // Saved
    }
  }

  Storage.addChangeListener('yaml', update);

  ASTManager.onFoldStatusChanged(function () {
    _.defer(function () { $scope.$apply(); });
  });
  $scope.toggle = ASTManager.toggleFold;
  $scope.isCollapsed = ASTManager.isFolded;


  /*
   * Focuses editor to a line that represents that path beginning
   * @param path {array} an array of keys into specs structure
   * that points out that specific node
  */
  $scope.focusEdit = function ($event, path) {
    $event.stopPropagation();
    var line = ASTManager.
    Editor.gotoLine(line);
  };

  // Add operation service methods directly
  _.extend($scope, Operation);
});
