'use strict';

var emitter = require('component-emitter'),
    props = require('./../game/observable-properties');

function PlayerModel(user, player) {
  emitter(this);

  props.copyObservables(this, user, player);
  this.user = user || {};
  this.player = player || {};
}

module.exports = PlayerModel;
