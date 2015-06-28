'use strict';

var BoardEntity = require('./board-entity');

class HexTile extends BoardEntity {
  constructor(factory, options) {
    super(factory, options);

    factory.defineProperties(this, {
      id: options.id,
      type: options.type,
      value: options.value,
      isResource: this.isResource
    });
  }

  addToBoard(board) {
    this.board = board;
  }

  isResource() {
    return this.type !== 'sea' && this.type !== 'desert';
  }

  getAdjacentTiles() {
    return this.spatialQuery((board) => {
      return {
        collection: board.tiles,
        radius: board.hexInfo.apothem * 2.1,
        center: this.center
      };
    });
  }

  getAdjacentCorners() {
    return this.spatialQuery((board) => {
      return {
        collection: board.corners,
        radius: board.hexInfo.circumradius * 1.1,
        center: this.center
      };
    });
  }
}

module.exports = HexTile;
