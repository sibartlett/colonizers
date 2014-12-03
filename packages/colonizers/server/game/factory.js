'use strict';

var common = require('./../../common/index'),
    props = require('./props');

function Factory() {}

Factory.prototype.createGame = function(options) {
  return new common.Game(this, options);
};

Factory.prototype.createBoard = function(options) {
  return new common.Board(this, options);
};

Factory.prototype.createHexTile = function(options) {
  return new common.HexTile(this, options);
};

Factory.prototype.createHexCorner = function(options) {
  return new common.HexCorner(this, options);
};

Factory.prototype.createHexEdge = function(options) {
  return new common.HexEdge(this, options);
};

Factory.prototype.createPlayer = function(options) {
  return new common.Player(this, options);
};

Factory.prototype.defineProperties = props.defineProperties;

module.exports = Factory;
