'use strict';

var emitter = require('component-emitter'),
    common = require('./../../../common/index'),
    Game = common.Game;

function UiGame() {
  Game.apply(this, arguments);
  emitter(this);
}

common.util.inherits(UiGame, Game);

UiGame.prototype.offerTrade = function(options) {
  Game.prototype.offerTrade.call(this, options);
  this.emit('TradeOffered');
};

UiGame.prototype.draw = function() {
  this.emit('draw');
};

UiGame.prototype.getPlayerColors = function() {
  if (!this._playerColors) {

    var colors = ['#ff0000', '#00ff00', '#0000ff'],
        players1 = [],
        players2 = [],
        result = {};

    this.players.forEach(function(player) {
      if (player.id === window.userId) {
        players1.push(player.id);
      } else {
        if (players1.length > 0) {
          players1.push(player.id);
        } else {
          players2.push(player.id);
        }
      }
    });

    players1
      .concat(players2)
      .forEach(function(playerId, index) {
        result[playerId] = colors[index];
      });

    this._playerColors = result;
  }
  return this._playerColors;
};

UiGame.prototype.showBuildableSettlements = function() {
  var currentPlayer = this.currentPlayer,
      corners = this.getBuildableCornersForCurrentPlayer();

  corners.forEach(function(corner) {
    corner.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.showBuildableEdges = function(cornerId) {
  var currentPlayer = this.currentPlayer,
      edges = this.getBuildableEdgesForCurrentPlayer(cornerId);

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
