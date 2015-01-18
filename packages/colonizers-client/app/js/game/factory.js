  'use strict';

var Game = require('./game'),
    Board = require('./board'),
    HexTile = require('./hex-tile'),
    HexCorner = require('./hex-corner'),
    HexEdge = require('./hex-edge'),
    Player = require('./player'),
    observableProps = require('./observable-properties');

function Factory(tileset) {
  this.tileset = tileset;

  // Process tileset, converting image data uris to image elements
  Object.keys(this.tileset.tiles).forEach(function(key) {
    if (this.tileset.tiles[key].bgimage) {
      var img = new Image();
      img.src = this.tileset.tiles[key].bgimage;
      this.tileset.tiles[key].bgimage = img;
    }
  }, this);
}

Factory.prototype.createGame = function(options) {
  return new Game(this, options);
};

Factory.prototype.createBoard = function(options) {
  return new Board(this, options);
};

Factory.prototype.createHexTile = function(options) {
  return new HexTile(this, options, this.tileset);
};

Factory.prototype.createHexCorner = function(options) {
  return new HexCorner(this, options);
};

Factory.prototype.createHexEdge = function(options) {
  return new HexEdge(this, options);
};

Factory.prototype.createPlayer = function(options) {
  return new Player(this, options);
};

Factory.prototype.defineProperties = observableProps.defineProperties;

module.exports = Factory;
