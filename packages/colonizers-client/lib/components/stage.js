'use strict';

var $ = require('jquery');
var ko = require('knockout');
var Stage = require('./../stage');

ko.bindingHandlers.stageInternal = {
  init: function(element, valueAccessor) {
    var stage = new Stage(element);
    var game = valueAccessor()();

    $(element).data('stage', stage);

    if (game) {
      stage.addGame(game);
    }
  },

  update: function(element, valueAccessor) {
    var stage = $(element).data('stage');
    var game = valueAccessor()();

    if (stage) {
      stage.removeGame();
      if (game) {
        stage.addGame(game);
      }
    }
  }
};

module.exports = {
  template: '<div class="canvas-konva" data-bind="stageInternal: game"></div>'
};
