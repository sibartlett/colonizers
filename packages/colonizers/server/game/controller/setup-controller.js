'use strict';

var _ = require('underscore');

function SetupController(parent) {
  this.parentController = parent;
  this.game = parent.game;
}

SetupController.prototype.onBuildRequest = function(req) {
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

SetupController.prototype.onBuildSettlementRequest = function(req, player) {
  var board = this.game.board,
      ownedCorners = board.corners.query({ owner: player }),
      corner;

  if (ownedCorners.length < 2) {
    corner = board.corners.getById(req.data.buildId);
    if (corner.isBuildable) {
      req.emit('Build', {
        playerId: player.id,
        buildType: 'corner',
        buildId: req.data.buildId
      });
    }
  }
};

SetupController.prototype.onBuildRoadRequest = function(req, player) {
  var board = this.game.board,
      ownedEdges = board.edges.query({ owner: player }),
      distributeResources = ownedEdges.length === 1,
      resources = {
        brick: 0,
        grain: 0,
        lumber: 0,
        ore: 0,
        wool: 0
      },
      data = {},
      edge,
      adjCorners,
      corner;

  if (ownedEdges.length < 2) {
    edge = board.edges.getById(req.data.buildId);

    if (edge.isBuildable) {
      adjCorners = edge.getAdjacentCorners();
      corner = _.find(adjCorners, function(corner) {
        if (corner.owner === null || corner.owner !== player.id) {
          return false;
        } else {
          return corner.getAdjacentEdges().every(function(edge) {
            return edge.isBuildable;
          });
        }
      });

      if (corner) {
        req.emit('Build', {
          playerId: player.id,
          buildType: 'edge',
          buildId: req.data.buildId
        });

        if (distributeResources) {
          corner
            .getAdjacentTiles()
            .filter(function(tile) {
              return tile.isResource;
            })
            .forEach(function(tile) {
              resources[tile.type]++;
            });

          data[player.id] = resources;
          req.emit('DistributeResources', data);
        }
        this.parentController.onEndTurnRequest(req);
      }
    }
  }
};

module.exports = SetupController;
