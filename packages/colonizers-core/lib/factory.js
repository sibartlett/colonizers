'use strict';

var core = require('./game-objects');
var props = require('./props');

function Factory() {}

Factory.prototype.createGame = function(options) {
  return new core.Game(this, options);
};

Factory.prototype.createBoard = function(options) {
  return new core.Board(this, options);
};

Factory.prototype.createHexTile = function(options) {
  return new core.HexTile(this, options);
};

Factory.prototype.createHexCorner = function(options) {
  return new core.HexCorner(this, options);
};

Factory.prototype.createHexEdge = function(options) {
  return new core.HexEdge(this, options);
};

Factory.prototype.createPlayer = function(options) {
  return new core.Player(this, options);
};

Factory.prototype.defineProperties = props.defineProperties;

module.exports = Factory;
