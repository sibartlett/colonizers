'use strict';

var emitter = require('component-emitter');
var Player = require('colonizers-core/lib/game-objects/player');

class UiPlayer extends Player {
  constructor(factory, options) {
    super(factory, options);
    emitter(this);
    this.color = ['#d9534f', '#5cb85c', '#428bca', '#d9534f'][options.index];
  }

  distribute(resources) {
    super.distribute(resources);
    this.emit('updated');
  }

  spend(resources) {
    super.spend(resources);
    this.emit('updated');
  }

  addVictoryPoint(devCard) {
    super.addVictoryPoint(devCard);
    this.emit('updated');
  }
}

module.exports = UiPlayer;
