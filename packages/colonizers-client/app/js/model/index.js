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
    clientUsers: [],

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
      currentPlayer = game.currentPlayer || {},
      thisPlayerId = this.thisPlayer && this.thisPlayer.id;

  return currentPlayer.id === thisPlayerId;
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
  var game,
      currentPlayer,
      currentPlayerId,
      userId;

  if (!this.clientUsers.length) {
    return;
  }

  if (this.clientUsers.length === 1) {
    userId = this.clientUsers[0];
    return _.find(this.players, function(player) {
      return player.id === userId;
    });
  }

  game = this.game || {};
  currentPlayer = game.currentPlayer || {};
  currentPlayerId = currentPlayer.id || null;

  if (!currentPlayerId) {
    return;
  }

  userId = _.find(this.clientUsers, function(id) {
    return id === currentPlayerId;
  });

  if (!userId) {
    return;
  }

  return _.find(this.players, function(player) {
    return player.id === userId;
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
  var thisPlayerId = this.thisPlayer && this.thisPlayer.id;

  return this.players.filter(function(player) {
    return player.id !== thisPlayerId;
  });
};

RoomModel.prototype.getOtherPlayersOrdered = function() {
  var thisPlayerId = this.thisPlayer && this.thisPlayer.id,
      thisPlayer = false,
      players1 = [],
      players2 = [];

  this.players.forEach(function(player) {
    if (player.id === thisPlayerId) {
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
