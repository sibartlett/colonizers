'use strict';

function BoardEntity(factory, options) {
  factory.defineProperties(this, {
    center: options.center,
    board: null
  });
}

BoardEntity.spatialQuery = function(callback) {
  return function() {
    if (this.board) {
      return this.board.spatialQuery(callback.bind(this));
    } else {
      return [];
    }
  };
};

module.exports = BoardEntity;
