'use strict';

var _ = require('underscore'),
    PlayerModel = require('./player.js'),
    observableProps = require('./../game/observable-properties');

function RoomModel(options) {
  this.factory = options.factory;
  this.actions = options.actions;
  this.emitterQueue = options.emitterQueue;
  this.notifications = options.notifications;

  observableProps.defineProperties(this, {
    game: null,
    users: [],

    turn: this.getTurn,
    myTurn: this.isMyTurn,
    players: this.getPlayers,
    currentPlayer: this.getCurrentPlayer,
    thisPlayer: this.getThisPlayer,
    thisPlayerOrEmpty: this.getThisPlayerOrEmpty,
    otherPlayers: this.getOtherPlayers,
    otherPlayersOrdered: this.getOtherPlayersOrdered
  });
}

RoomModel.prototype.getTurn = function() {
  return this.game && this.game.turn || 0;
};

RoomModel.prototype.isMyTurn = function() {
  var game = this.game || {},
      currentPlayer = game.currentPlayer || {};

  return currentPlayer.id === window.userId || false;
};

RoomModel.prototype.getPlayers = function() {
  var users = this.users,
      game = this.game;

  if (game) {
    return game.players.map(function(player) {
      var user = _.find(users, function(user) {
        return user.id === player.id;
      });

      user = user || {
        id: player.id,
        username: '',
        name: '',
        avatarUrl: ''
      };

      return new PlayerModel(user, player);
    });

  } else {
    return users.map(function(user) {
      var ply = this.factory.createPlayer({
        id: user.id
      });
      return new PlayerModel(user, ply);
    }, this);
  }
};

RoomModel.prototype.getCurrentPlayer = function() {
  var game = this.game || {},
      currentPlayer = game.currentPlayer || {},
      currentPlayerId = currentPlayer.id || null;

  if (currentPlayerId) {
    return _.find(this.players, function(player) {
      return player.id === currentPlayerId;
    });
  } else {
    return null;
  }
};

RoomModel.prototype.getThisPlayer = function() {
  return _.find(this.players, function(player) {
    return player.id === window.userId;
  });
};

RoomModel.prototype.getThisPlayerOrEmpty = function() {
  var player = this.getThisPlayer(),
      user,
      ply;

  if (!player) {
    user = {
      id: '',
      username: '',
      name: '',
      avatarUrl: ''
    };
    ply = this.factory.createPlayer({
      id: user.id
    });
    player = new PlayerModel(user, ply);
  }

  return player;
};

RoomModel.prototype.getOtherPlayers = function() {
  return this.players.filter(function(player) {
    return player.id !== window.userId;
  });
};

RoomModel.prototype.getOtherPlayersOrdered = function() {
  var thisPlayer = false,
      players1 = [],
      players2 = [];

  this.players.forEach(function(player) {
    if (player.id === window.userId) {
      thisPlayer = true;
    } else {
      if (thisPlayer) {
        players1.push(player);
      } else {
        players2.push(player);
      }
    }
  });

  return players1.concat(players2);
};

module.exports = RoomModel;
