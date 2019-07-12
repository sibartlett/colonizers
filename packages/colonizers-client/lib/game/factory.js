'use strict';

var Game = require('./game');
var Board = require('./board');
var HexTile = require('./hex-tile');
var HexCorner = require('./hex-corner');
var HexEdge = require('./hex-edge');
var Player = require('./player');
var observableProps = require('./observable-properties');

class Factory {
  constructor(options) {
    this.tileset = options.tileset;

    // Process tileset, converting image data uris to image elements
    Object.keys(this.tileset.tiles).forEach(function(key) {
      if (this.tileset.tiles[key].bgimage) {
        var img = new window.Image();
        img.src = this.tileset.tiles[key].bgimage;
        this.tileset.tiles[key].bgimage = img;
      }
    }, this);
  }

  createGame(options) {
    return new Game(this, options);
  }

  createBoard(options) {
    return new Board(this, options);
  }

  createHexTile(options) {
    return new HexTile(this, options, this.tileset);
  }

  createHexCorner(options) {
    return new HexCorner(this, options);
  }

  createHexEdge(options) {
    return new HexEdge(this, options);
  }

  createPlayer(options) {
    return new Player(this, options);
  }

  defineProperties() {
    observableProps.defineProperties.apply(this, arguments);
  }
}

module.exports = Factory;
