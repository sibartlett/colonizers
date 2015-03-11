'use strict';

var BoardEntity = require('./board-entity'),
    spatialQuery = BoardEntity.spatialQuery,
    util = require('./../util');

function HexCorner(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    owner: null,
    isBuildable: true,
    buildType: null,
    isSettlement: this.isSettlement,
    isCity: this.isCity
  });
}

util.inherits(HexCorner, BoardEntity);

HexCorner.prototype.addToBoard = function(board) {
  this.board = board;
};

HexCorner.prototype.isSettlement = function() {
  return this.owner && this.buildType === 'settlement';
};

HexCorner.prototype.isCity = function() {
  return this.owner && this.buildType === 'city';
};

HexCorner.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

HexCorner.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

HexCorner.prototype.getAdjacentEdges = spatialQuery(function(board) {
  return {
    collection: board.edges,
    radius: board.hexInfo.circumradius * 0.6,
    center: this.center
  };
});

HexCorner.prototype.buildSettlement = function(player) {
  var corners = this.getAdjacentCorners();

  this.owner = player.id;
  this.isBuildable = false;
  this.buildType = 'settlement';

  corners.forEach(function(corner) {
    corner.isBuildable = false;
  });
};

HexCorner.prototype.buildCity = function(player) {
  var corners = this.getAdjacentCorners();

  this.owner = player.id;
  this.isBuildable = false;
  this.buildType = 'city';

  corners.forEach(function(corner) {
    corner.isBuildable = false;
  });
};

module.exports = HexCorner;
