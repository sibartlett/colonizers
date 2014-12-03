'use strict';

var _ = require('underscore'),
    emitter = require('component-emitter');

function RoomUserManager(options) {
  emitter(this);

  options = options || {};

  this.locked = options.locked || false;

  this.players = (options.users || []).map(function(user) {
    return user.toSafeObject();
  });

  this.sockets = {};
  this.users = [];
}

RoomUserManager.prototype.lock = function() {
  this.locked = true;
};

RoomUserManager.prototype.unlock = function() {
  this.locked = false;
};

RoomUserManager.prototype.getPlayers = function() {
  return this.players;
};

RoomUserManager.prototype.getUsers = function() {
  return this.users;
};

RoomUserManager.prototype.getPlayerIds = function() {
  return this.users.map(function(user) {
    return user.id;
  });
};

RoomUserManager.prototype.getUserIds = function() {
  return this.users.map(function(user) {
    return user.id;
  });
};

RoomUserManager.prototype.getPlayerCount = function() {
  return this.users.length;
};

RoomUserManager.prototype.getUserCount = function() {
  return this.users.length;
};

RoomUserManager.prototype.getPlayerById = function(userId) {
  return _.find(this.players, function(user) {
    return user.id === userId;
  });
};

RoomUserManager.prototype.getUserById = function(userId) {
  return _.find(this.users, function(user) {
    return user.id === userId;
  });
};

RoomUserManager.prototype.getUserIdBySocketId = function(socketId) {
  var filter = function(socket) {
        return socket.id === socketId;
      },
      userId,
      sockets,
      found;

  for (userId in this.sockets) {
    sockets = this.sockets[userId];
    found = sockets.some(filter);

    if (found) {
      return userId;
    }
  }
  return null;
};

RoomUserManager.prototype.addUser = function(socket, callback) {
  var socketUser = socket.request.user,
      userId = socket.request.user._id.toString(),
      user = this.getUserById(userId),
      player = this.getPlayerById(userId),
      sockets,
      skt;

  if (!user) {

    user = socketUser.toSafeObject();
    this.users.push(user);
  }

  if (!this.sockets[userId]) {
    this.sockets[userId] = [];
  }

  sockets = this.sockets[userId];
  skt = _.find(sockets, function(x) { return x.id === socket.id; });

  if (!skt) {
    skt = socket;
    sockets.push(socket);
  }

  if (!player && !this.locked) {
    player = socketUser.toSafeObject();
    this.players.push(player);
    this.emit('playersChanged');
  }

  callback(user, player);
  return user;
};

RoomUserManager.prototype.removeUser = function(socket) {
  var userRemoved = false,
      userId = this.getUserIdBySocketId(socket.id),
      player,
      user,
      sockets,
      socketIndex,
      userIndex,
      playerIndex;

  if (userId) {
    sockets = this.sockets[userId];
    socketIndex = sockets.indexOf(socket);

    if (socketIndex > -1) {
      sockets.splice(socketIndex, 1);
    }

    if (sockets.length === 0) {
      delete this.sockets[userId];
      user = this.getUserById(userId);
      userIndex = this.users.indexOf(user);
      if (userIndex > -1) {
        this.users.splice(userIndex, 1);
        userRemoved = true;
      }
    }
  }

  if (userRemoved && !this.locked) {
    player = this.getPlayerById(userId);
    if (player) {
      playerIndex = this.players.indexOf(player);
      if (playerIndex > -1) {
        this.players.splice(playerIndex, 1);
        this.emit('playersChanged');
      }
    }
  }
};

module.exports = RoomUserManager;
