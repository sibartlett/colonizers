'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Stage = require('./../stage');

ko.bindingHandlers.stageInternal = {
  init: function(element, valueAccessor) {
    var stage = new Stage(element),
        game = valueAccessor()();

    $(element).data('stage', stage);

    if (game) {
      stage.addGame(game);
    }
  },
  update: function(element, valueAccessor) {
    var stage = $(element).data('stage'),
        game = valueAccessor()();

    if (stage) {
      stage.removeGame();
      if (game) {
        stage.addGame(game);
      }
    }
  }
};

module.exports = {
  template: '<div class="canvas-kinetic" data-bind="stageInternal: game"></div>'
};
