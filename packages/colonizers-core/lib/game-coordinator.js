'use strict';

function GameCoordinator(emitterQueue, game) {
  this.emitterQueue = emitterQueue;
  this.game = game;

  this.onDistributeResources = this.onDistributeResources.bind(this);
  this.onBuild = this.onBuild.bind(this);
  this.onNextTurn = this.onNextTurn.bind(this);
  this.onOfferTrade = this.onOfferTrade.bind(this);

  this.emitterQueue.on('NextTurn', this.onNextTurn);
  this.emitterQueue.on('Build', this.onBuild);
  this.emitterQueue.on('DistributeResources', this.onDistributeResources);
  this.emitterQueue.on('OfferTrade', this.onOfferTrade);
}

GameCoordinator.prototype.setGame = function(game) {
  this.game = game;
};

GameCoordinator.prototype.onNextTurn = function(data, next) {
  var turn = this.game.turn + 1;
  this.game.setTurn(turn);
  next();
};

GameCoordinator.prototype.onBuild = function(data, next) {
  var corner, edge, player;
  player = this.game.getPlayerById(data.playerId);

  if (data.buildType === 'settlement') {
    corner = this.game.board.corners.getById(data.buildId);
    corner.buildSettlement(player);
    player.addVictoryPoint();
    if (this.game.phase !== 'setup') {
      player.spend({
        lumber: 1,
        brick: 1,
        wool: 1,
        grain: 1
      });
    }
  } else if (data.buildType === 'city') {
    corner = this.game.board.corners.getById(data.buildId);
    corner.buildCity(player);
    player.addVictoryPoint();

    player.spend({
      ore: 3,
      grain: 2
    });
  } else if (data.buildType === 'road') {
    edge = this.game.board.edges.getById(data.buildId);
    edge.build(player);
    if (this.game.phase !== 'setup') {
      player.spend({
        lumber: 1,
        brick: 1
      });
    }
  }
  next();
};

GameCoordinator.prototype.onDistributeResources = function(data, next) {
  var player, playerId, resources;
  for (playerId in data) {
    resources = data[playerId];
    player = this.game.getPlayerById(playerId);
    player.distribute(resources);
  }
  next();
};

GameCoordinator.prototype.onOfferTrade = function(data, next) {
  this.game.offerTrade(data);
  next();
};

module.exports = GameCoordinator;
