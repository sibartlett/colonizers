'use strict';

function GameCoordinator(emitterQueue, game) {
  this.emitterQueue = emitterQueue;
  this.game = game;

  this.onDistributeResources = this.onDistributeResources.bind(this);
  this.onBuildRoad = this.onBuildRoad.bind(this);
  this.onBuildSettlement = this.onBuildSettlement.bind(this);
  this.onBuildCity = this.onBuildCity.bind(this);
  this.onNextTurn = this.onNextTurn.bind(this);
  this.onDiceRoll = this.onDiceRoll.bind(this);
  this.onOfferTrade = this.onOfferTrade.bind(this);

  this.emitterQueue.on('start-turn', this.onNextTurn);
  this.emitterQueue.on('DiceRoll', this.onDiceRoll);
  this.emitterQueue.on('build-road', this.onBuildRoad);
  this.emitterQueue.on('build-settlement', this.onBuildSettlement);
  this.emitterQueue.on('build-city', this.onBuildCity);
  this.emitterQueue.on('distribute-resources', this.onDistributeResources);
  this.emitterQueue.on('trade-offer', this.onOfferTrade);
}

GameCoordinator.prototype.setGame = function(game) {
  this.game = game;
};

GameCoordinator.prototype.onNextTurn = function(data, next) {
  var turn = this.game.turn + 1;
  this.game.setTurn(turn);
  next();
};

GameCoordinator.prototype.onDiceRoll = function(data, next) {
  this.game.rolls++;
  this.game.rolls++;
  next();
};

GameCoordinator.prototype.onBuildRoad = function(data, next) {
  var player = this.game.getPlayerById(data.playerId);
  var edge = this.game.board.edges.getById(data.buildId);

  edge.build(player);

  if (this.game.phase !== 'setup') {
    player.spend({
      lumber: 1,
      brick: 1
    });
  }

  next();
};

GameCoordinator.prototype.onBuildSettlement = function(data, next) {
  var player = this.game.getPlayerById(data.playerId);
  var corner = this.game.board.corners.getById(data.buildId);

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

  next();
};

GameCoordinator.prototype.onBuildCity = function(data, next) {
  var player = this.game.getPlayerById(data.playerId);
  var corner = this.game.board.corners.getById(data.buildId);

  corner.buildCity(player);
  player.addVictoryPoint();

  player.spend({
    ore: 3,
    grain: 2
  });

  next();
};

GameCoordinator.prototype.onDistributeResources = function(data, next) {
  var player;
  var playerId;
  var resources;

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
