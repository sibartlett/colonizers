'use strict';

var uuid = require('node-uuid'),
    GameContext = require('colonizers-core/lib/game-context'),
    RoomUserManager = require('./room-user-manager');

function Room(io, document, logger) {
  this.document = document;
  this.logger = logger;
  this.id = document._id;
  this.numPlayers = document.numPlayers;
  this.gameOptions = document.gameOptions;
  this.owner = null;
  this.io = io.to(this.id);

  this.loadGame = this.loadGame.bind(this);

  if (document.game) {
    this.users = new RoomUserManager({
      users: document.users,
      locked: true
    });
    this.status = 'started';
    this.gameOptions = document.gameOptions;
    this.loadGame();
  } else {
    this.users = new RoomUserManager();
    this.status = 'waiting';
    this.gameOptions = null;
    this.gameContext = null;
  }

  this.users.on('playersChanged', this.sendUsers.bind(this));
}

Room.prototype.saveEvent = function(event, data, cb) {
  this.document.gameEvents.push({
    name: event,
    data: data
  });
  this.document.save(cb);
};

Room.prototype.loadGame = function() {
  this.gameContext = GameContext.fromSave({
    game: this.document.game,
    events: this.document.gameEvents,
    saveEvent: this.saveEvent.bind(this),
    emitEventsTo: this.io
  }, this.onContextReady.bind(this));
};

Room.prototype.onContextReady = function(context) {
  this.sendGameData(this.io);

  this.users.getPlayerSockets().forEach(function(player) {
    player.sockets.forEach(function(socket) {
      this.registerPlayerEvents(player.id, socket);
    }, this);
  }, this);

  context.start();
};

Room.prototype.registerPlayerEvents = function(playerId, emitter) {
  if (!this.gameContext || !this.gameContext.controller) {
    return;
  }

  var events = this.gameContext.controller.getEventNames();

  events.forEach(function(key) {
    emitter.on(key, function(data, respond) {
      if (typeof data === 'function') {
        respond = data;
        data = undefined;
      }

      var logger = emitter.logger.child({
        reqId: uuid()
      });

      if (data) {
        logger.info(key + ' request.', data);
      } else {
        logger.info(key + ' request.');
      }

      this.gameContext.pushEvent({
        playerId: playerId,
        event: key,
        data: data,
        logger: logger
      }, respond);
    }.bind(this));
  }, this);
};

Room.prototype.attachLogger = function(socket) {
  var logOpt = {
    socketId: socket.id,
    roomId: this.id
  };

  if (socket.request.user) {
    logOpt.userId = socket.request.user._id.toString();
    logOpt.userName = socket.request.user.name.toString();
  }

  socket.logger = this.logger.child(logOpt);
};

Room.prototype.join = function(socket) {
  this.attachLogger(socket);
  socket.logger.info('Joining room.');

  socket.join(this.id);
  socket.on('disconnect', function() {
    this.disconnect(socket);
  }.bind(this));

  this.users.addUser(socket, function(user, player) {
    if (player) {
      this.registerPlayerEvents(user.id, socket);
    }

    this.sendUsers(socket);
    this.sendGameData(socket);

    if (this.status === 'waiting' &&
        this.numPlayers === this.users.getPlayerCount()) {
      this.startGame();
    }

  }.bind(this));

};

Room.prototype.disconnect = function(socket) {
  socket.logger.info('Leaving room', {
    roomId: this.id
  });

  delete socket.logger;
  socket.removeAllListeners();
  this.users.removeUser(socket);
};

Room.prototype.sendUsers = function(emitter) {
  var users = this.users.getPlayers();
  emitter = emitter || this.io;
  emitter.emit('room_users', users);
};

Room.prototype.sendGameData = function(emitter) {
  if (this.gameContext) {
    emitter.emit('GameData', this.gameContext.getState());
  }
};

Room.prototype.startGame = function() {
  if (this.status !== 'waiting') {
    return;
  }

  var players = this.users.getPlayers(),
      options = {
        players: players,
        gameOptions: this.gameOptions,
        saveEvent: this.saveEvent.bind(this),
        emitEventsTo: this.io
      };

  this.users.lock();

  this.logger.info('Starting game.');
  this.status = 'started';

  this.gameContext = GameContext.fromScenario(options, function(gameContext) {
    this.document.users = this.users.getPlayerIds();
    this.document.game = gameContext.getState();
    this.document.save(function() {
      this.onContextReady.bind(this)(gameContext);
    }.bind(this));
  }.bind(this));
};

module.exports = Room;
