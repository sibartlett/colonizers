'use strict';

var BoardEntity = require('./board-entity');
var spatialQuery = BoardEntity.spatialQuery;
var util = require('./../util');

function HexTile(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    type: options.type,
    value: options.value,
    isResource: this.isResource
  });
}

util.inherits(HexTile, BoardEntity);

HexTile.prototype.addToBoard = function(board) {
  this.board = board;
};

HexTile.prototype.isResource = function() {
  return this.type !== 'sea' && this.type !== 'desert';
};

HexTile.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.apothem * 2.1,
    center: this.center
  };
});

HexTile.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

module.exports = HexTile;
