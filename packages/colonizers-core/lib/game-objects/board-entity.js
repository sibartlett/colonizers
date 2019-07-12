'use strict';

class BoardEntity {
  constructor(factory, options) {
    factory.defineProperties(this, {
      center: options.center,
      board: null
    });
  }

  spatialQuery(callback) {
    if (this.board) {
      return this.board.spatialQuery(callback);
    } else {
      return [];
    }
  }
}

module.exports = BoardEntity;
