'use strict';

var BoardEntity = require('./board-entity');

class HexEdge extends BoardEntity {
  constructor(factory, options) {
    super(factory, options);

    factory.defineProperties(this, {
      id: options.id,
      ends: options.ends,
      owner: null,
      isBuildable: true
    });
  }

  addToBoard(board) {
    this.board = board;
  }

  getAdjacentCorners() {
    return this.spatialQuery((board) => {
      return {
        collection: board.corners,
        radius: board.hexInfo.circumradius * 0.6,
        center: this.center
      };
    });
  }

  getAdjacentEdges() {
    return this.spatialQuery((board) => {
      return {
        collection: board.edges,
        radius: board.hexInfo.apothem * 1.1,
        center: this.center
      };
    });
  }

  getAdjacentTiles() {
    return this.spatialQuery((board) => {
      return {
        collection: board.tiles,
        radius: board.hexInfo.apothem * 1.1,
        center: this.center
      };
    });
  }

  build(player) {
    this.owner = player.id;
    this.isBuildable = false;
  }
}

module.exports = HexEdge;
