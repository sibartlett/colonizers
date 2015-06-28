'use strict';

var core = require('./game-objects');
var props = require('./props');

class Factory {
  createGame(options) {
    return new core.Game(this, options);
  }

  createBoard(options) {
    return new core.Board(this, options);
  }

  createHexTile(options) {
    return new core.HexTile(this, options);
  }

  createHexCorner(options) {
    return new core.HexCorner(this, options);
  }

  createHexEdge(options) {
    return new core.HexEdge(this, options);
  }

  createPlayer(options) {
    return new core.Player(this, options);
  }

  defineProperties() {
    props.defineProperties.apply(this, arguments);
  }
}

module.exports = Factory;
