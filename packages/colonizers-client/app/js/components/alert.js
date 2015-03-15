'use strict';

var async = require('async'),
    template = require('./alert.html'),
    observableProps = require('./../game/observable-properties'),
    DieModel = require('./d6');

function AlertModel(roomModel) {
  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    message: null,
    showDice: false
  });

  this.die1 = new DieModel();
  this.die2 = new DieModel();

  roomModel.subscribe('game', this.onGameLoaded.bind(this));
  roomModel.emitterQueue.on('start-turn', this.onNextTurn.bind(this));
  roomModel.emitterQueue.on('DiceRoll', this.onDiceRoll.bind(this));
}

AlertModel.prototype.dismiss = function() {
  this.message = null;
  this.showDice = false;
};

AlertModel.prototype.onGameLoaded = function(game) {
  if (game && game.turn > 0) {
    this.onNextTurn({
      playerId: game.currentPlayer.id
    });
  }
};

AlertModel.prototype.onNextTurn = function(data, next) {
  var currentPlayer = this.roomModel.currentPlayer;

  this.showDice = false;
  if (data.playerId === window.userId) {
    this.message = 'Your turn';
  } else {
    this.message = currentPlayer.user.name + '\'s turn';
  }
  if (next) {
    next();
  }
};

AlertModel.prototype.onDiceRoll = function(data, next) {
  var currentPlayer = this.roomModel.currentPlayer,
      name = currentPlayer.user.name,
      done,
      die1,
      die2;

  this.showDice = true;

  if (currentPlayer.id === window.userId) {
    this.message = 'You are rolling the dice';
    done = function() {
      this.message = 'You rolled ' + data.total;
      next();
    }.bind(this);
  } else {
    this.message = name + ' is rolling the dice';
    done = function() {
      this.message = name + ' rolled ' + data.total;
      next();
    }.bind(this);
  }

  die1 = function(callback) {
    this.die1.start(data.die1, callback);
  }.bind(this);

  die2 = function(callback) {
    this.die2.start(data.die2, callback);
  }.bind(this);

  return async.parallel([die1, die2], done);
};

module.exports = {
  viewModel: AlertModel,
  template: template
};
