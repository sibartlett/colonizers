'use strict';

var collections = require('./collections/hex-collections');

class Board {
  constructor(factory, options) {
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

  spatialQuery(optionsFunc) {
    var options = optionsFunc.bind(this)(this);
    return options.collection.query({
      within: { radius: options.radius, of: options.center }
    });
  }

  addTiles(tiles) {
    tiles.forEach(this.addTile);
  }

  addCorners(corners) {
    corners.forEach(this.addCorner);
  }

  addEdges(edges) {
    edges.forEach(this.addEdge);
  }

  addTile(tile) {
    this.tiles.push(tile);
    tile.addToBoard(this);
  }

  addCorner(corner) {
    this.corners.push(corner);
    corner.addToBoard(this);
  }

  addEdge(edge) {
    this.edges.push(edge);
    edge.addToBoard(this);
  }
}

module.exports = Board;
