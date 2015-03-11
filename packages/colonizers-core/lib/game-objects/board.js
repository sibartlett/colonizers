'use strict';

var collections = require('./collections/hex-collections');

function Board(factory, options) {
  factory.defineProperties(this, {
    height: options.height,
    width: options.width,
    hexInfo: options.hexInfo,
    game: null
  });

  this.width = options.width;
  this.height = options.height;
  this.hexInfo = options.hexInfo;
  this.game = null;

  this.corners = new collections.HexCornerCollection();
  this.edges = new collections.HexEdgeCollection();
  this.tiles = new collections.HexTileCollection();

  this.addEdge = this.addEdge.bind(this);
  this.addCorner = this.addCorner.bind(this);
  this.addTile = this.addTile.bind(this);
}

Board.prototype.spatialQuery = function(optionsFunc) {
  var options = optionsFunc.bind(this)(this);
  return options.collection.query({
    within: { radius: options.radius, of: options.center }
  });
};

Board.prototype.addTiles = function(tiles) {
  tiles.forEach(this.addTile);
};

Board.prototype.addCorners = function(corners) {
  corners.forEach(this.addCorner);
};

Board.prototype.addEdges = function(edges) {
  edges.forEach(this.addEdge);
};

Board.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  tile.addToBoard(this);
};

Board.prototype.addCorner = function(corner) {
  this.corners.push(corner);
  corner.addToBoard(this);
};

Board.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  edge.addToBoard(this);
};

module.exports = Board;
