'use strict';

var emitter = require('component-emitter');
var util = require('colonizers-core/lib/util');
var Game = require('colonizers-core/lib/game-objects/game');

function UiGame() {
  Game.apply(this, arguments);
  emitter(this);
}

util.inherits(UiGame, Game);

UiGame.prototype.offerTrade = function(options) {
  Game.prototype.offerTrade.call(this, options);
  this.emit('TradeOffered');
};

UiGame.prototype.draw = function() {
  this.emit('draw');
};

UiGame.prototype.showBuildableSettlements = function() {
  var currentPlayer = this.currentPlayer;
  var corners = this.getBuildableCornersForCurrentPlayer();

  corners.forEach(function(corner) {
    corner.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.showBuildableCities = function() {
  var currentPlayer = this.currentPlayer;
  var settlements = this.getSettlementsForPlayer(currentPlayer);

  settlements.forEach(function(settlement) {
    settlement.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.showBuildableEdges = function(cornerId) {
  var currentPlayer = this.currentPlayer;
  var edges = this.getBuildableEdgesForCurrentPlayer(cornerId);

  edges.forEach(function(edge) {
    edge.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.hideBuildableEntities = function() {
  this.board.corners.query({
    buildable: true
  })
  .forEach(function(corner) {
    corner.hide();
  });

  this.board.edges.query({
    buildable: true
  })
  .forEach(function(edge) {
    edge.hide();
  });

  this.draw();
};

module.exports = UiGame;
