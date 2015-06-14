'use strict';

var Game = require('./game');
var Board = require('./board');
var HexTile = require('./hex-tile');
var HexCorner = require('./hex-corner');
var HexEdge = require('./hex-edge');
var Player = require('./player');
var observableProps = require('./observable-properties');

function Factory(options) {
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
