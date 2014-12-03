'use strict';

var BoardEntity = require('./board-entity'),
    spatialQuery = BoardEntity.spatialQuery,
    util = require('./util');

function HexEdge(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    ends: options.ends,
    owner: null,
    isBuildable: true
  });
}

util.inherits(HexEdge, BoardEntity);

HexEdge.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 0.6,
    center: this.center
  };
});

HexEdge.prototype.getAdjacentEdges = spatialQuery(function(board) {
  return {
    collection: board.edges,
    radius: board.hexInfo.apothem * 1.1,
    center: this.center
  };
});

HexEdge.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.apothem * 1.1,
    center: this.center
  };
});

HexEdge.prototype.build = function(player) {
  this.owner = player.id;
  this.isBuildable = false;
};

module.exports = HexEdge;
