'use strict';

var emitter = require('component-emitter'),
    core = require('colonizers-core'),
    Player = core.Player;

function UiPlayer() {
  Player.apply(this, arguments);
  emitter(this);
}

core.util.inherits(UiPlayer, Player);

UiPlayer.prototype.distribute = function(resources) {
  Player.prototype.distribute.call(this, resources);
  this.emit('updated');
};

UiPlayer.prototype.spend = function(resources) {
  Player.prototype.spend.call(this, resources);
  this.emit('updated');
};

UiPlayer.prototype.addVictoryPoint = function(devCard) {
  Player.prototype.addVictoryPoint.call(this, devCard);
  this.emit('updated');
};

module.exports = UiPlayer;
