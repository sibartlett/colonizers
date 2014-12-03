'use strict';

function PlayController(parent) {
  this.parentController = parent;
  this.game = parent.game;
}

PlayController.prototype.onBuildRequest = function(req) {
  var currentPlayer = this.game.currentPlayer;

  if (currentPlayer.id !== req.playerId) {
    return;
  }

  if (req.data.buildType === 'edge') {
    this.onBuildRoadRequest(req, currentPlayer);
  }
  else if (req.data.buildType === 'corner') {
    this.onBuildSettlementRequest(req, currentPlayer);
  }
};

PlayController.prototype.onBuildRoadRequest = function(req, player) {
  var hasRequiredResources,
      roads,
      hasAllowance,
      buildableEdges,
      validSpot;

  hasRequiredResources = player.hasResources({
    lumber: 1,
    brick: 1
  });

  if (hasRequiredResources) {

    roads = this.game.board.edges.query({ owner: player });
    hasAllowance = roads.length < this.game.allowance.roads;

    if (hasAllowance) {

      buildableEdges = this.game.getBuildableEdgesForPlayer(player);
      validSpot = buildableEdges.some(function(edge) {
        return edge.id === req.data.buildId;
      });

      if (validSpot) {
        req.emit('Build', {
          playerId: player.id,
          buildType: 'edge',
          buildId: req.data.buildId
        });
      }
    }
  }
};

PlayController.prototype.onBuildSettlementRequest = function(req, player) {
  var hasRequiredResources,
      settlements,
      hasAllowance,
      buildableSpots,
      validSpot;

  hasRequiredResources = player.hasResources({
    lumber: 1,
    brick: 1,
    wool: 1,
    grain: 1
  });

  if (hasRequiredResources) {

    settlements = this.game.board.corners.query({
      owner: player,
      settlement: true
    });
    hasAllowance = settlements.length < this.game.allowance.settlements;

    if (hasAllowance) {

      buildableSpots = this.game.getBuildableCornersForPlayer(player);
      validSpot = buildableSpots.some(function(corner) {
        return corner.id === req.data.buildId;
      });

      if (validSpot) {
        req.emit('Build', {
          playerId: player.id,
          buildType: 'corner',
          buildId: req.data.buildId
        });
      }
    }
  }
};

module.exports = PlayController;
