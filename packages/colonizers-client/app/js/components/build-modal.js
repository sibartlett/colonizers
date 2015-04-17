'use strict';

var $ = require('jquery');
var template = require('./templates').buildModal;
var observableProps = require('./../game/observable-properties');

function BuildModalModel(roomModel) {

  this.buildCity = this.buildCity.bind(this);
  this.buildSettlement = this.buildSettlement.bind(this);
  this.buildRoad = this.buildRoad.bind(this);
  this.resetAllowances = this.resetAllowances.bind(this);
  this.resetCanBuildProps = this.resetCanBuildProps.bind(this);
  this.onDistributeResources = this.onDistributeResources.bind(this);
  this.onBuildRoad = this.onBuildRoad.bind(this);
  this.onBuildSettlement = this.onBuildSettlement.bind(this);
  this.onBuildCity = this.onBuildCity.bind(this);

  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    allowanceRoads: 0,
    allowanceSettlements: 0,
    allowanceCities: 0,
    canBuildRoad: false,
    canBuildSettlement: false,
    canBuildCity: false
  });

  roomModel.subscribe('thisPlayer', this.resetAllowances);
  roomModel.subscribe('game', this.resetAllowances);
  roomModel.emitterQueue.on('distribute-resources', this.onDistributeResources);
  roomModel.emitterQueue.on('build-road', this.onBuildRoad);
  roomModel.emitterQueue.on('build-settlement', this.onBuildSettlement);
  roomModel.emitterQueue.on('build-city', this.onBuildCity);
}

BuildModalModel.prototype.resetAllowances = function() {
  var thisPlayer = this.roomModel.thisPlayer;
  var player = thisPlayer ? thisPlayer.player : null;
  var game = this.roomModel.game;

  this.allowanceRoads = 0;
  this.allowanceSettlements = 0;
  this.allowanceCities = 0;

  if (player && game && game.allowance) {
    var edges = game.board.edges.query({
      owner: player
    });

    var corners = game.board.corners.query({
      owner: player
    });

    this.allowanceRoads = game.allowance.roads - edges.length;
    this.allowanceSettlements = game.allowance.settlements - corners.length;
    this.allowanceCities = game.allowance.cities;
  }

  this.resetCanBuildProps();
};

BuildModalModel.prototype.resetCanBuildProps = function() {
  var thisPlayer = this.roomModel.thisPlayer;
  var player = thisPlayer ? thisPlayer.player : null;
  var game = this.roomModel.game;

  this.canBuildRoad = false;
  this.canBuildSettlement = false;
  this.canBuildCity = false;

  if (game && player && player.hasResources) {

    var edges = game.getBuildableEdgesForPlayer(player);
    var corners = game.getBuildableCornersForPlayer(player);
    var cornerSettlements = game.getSettlementsForPlayer(player);

    var roads = this.allowanceRoads > 0 &&
            edges.length > 0 &&
            player.hasResources({
              lumber: 1,
              brick: 1
            });

    this.canBuildRoad = roads;

    var settlements = this.allowanceSettlements > 0 &&
                  corners.length > 0 &&
                  player.hasResources({
                    lumber: 1,
                    brick: 1,
                    wool: 1,
                    grain: 1
                  });

    this.canBuildSettlement = settlements;

    var cities = this.allowanceCities > 0 &&
             cornerSettlements.length > 0 &&
             player.hasResources({
               ore: 3,
               grain: 2
             });

    this.canBuildCity = cities;
  }
};

BuildModalModel.prototype.onDistributeResources = function(data, next) {
  this.resetCanBuildProps();
  next();
};

BuildModalModel.prototype.onBuildRoad = function(data, next) {
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer && thisPlayer.id === data.playerId) {
    this.allowanceRoads = this.allowanceRoads - 1;
    this.resetCanBuildProps();
  }

  next();
};

BuildModalModel.prototype.onBuildSettlement = function(data, next) {
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer && thisPlayer.id === data.playerId) {
    this.allowanceSettlements = this.allowanceSettlements - 1;
    this.resetCanBuildProps();
  }

  next();
};

BuildModalModel.prototype.onBuildCity = function(data, next) {
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer && thisPlayer.id === data.playerId) {
    this.allowanceSettlements = this.allowanceSettlements + 1;
    this.allowanceCities = this.allowanceCities - 1;
    this.resetCanBuildProps();
  }

  next();
};

BuildModalModel.prototype.buildRoad = function() {
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableEdges();
};

BuildModalModel.prototype.buildSettlement = function() {
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableSettlements();
};

BuildModalModel.prototype.buildCity = function() {
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableCities();
};

module.exports = {
  viewModel: BuildModalModel,
  template: template
};
