'use strict';

var Emitter = require('component-emitter'),
    common = require('./../common/index'),
    EmitterQueue = common.EmitterQueue,
    GameCoordinator = common.GameCoordinator,
    Factory = require('./game/factory'),
    GameBuilder = require('./game/game-builder'),
    GameController = require('./game/game-controller'),
    RoomEmitter = require('./room-emitter'),
    RoomUserManager = require('./room-user-manager'),
    gameBuilder = new GameBuilder(),
    gameSerializer = new common.GameSerializer(new Factory());

function Room(io, document, logger) {
  this.document = document;
  this.logger = logger;
  this.id = document._id;
  this.numPlayers = document.numPlayers;
  this.gameOptions = document.gameOptions;
  this.owner = null;
  this.io = io.to(this.id);
  this.gameController = null;
  this.gameCoordinator = null;

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
    this.game = null;
    this.gameOptions = null;
  }

  this.users.on('playersChanged', this.sendUsers.bind(this));
}

Room.prototype.loadGame = function() {
  var emitter,
      emitterQueue,
      doneReplaying;

  this.game = gameSerializer.deserialize(this.document.game);

  emitter = new Emitter();
  emitterQueue = new EmitterQueue(emitter);
  this.gameCoordinator = new GameCoordinator(emitterQueue, this.game);

  doneReplaying = function() {
    var roomEmitter = new RoomEmitter(this.document, [emitter, this.io]);
    this.gameController = new GameController(this.game, roomEmitter, []);
    this.sendGameData(this.io);
    this.gameController.start();
  }.bind(this);

  if (this.document.gameEvents.length) {
    emitterQueue.onceDrain(doneReplaying);
    this.document.gameEvents.forEach(function(event) {
      emitter.emit(event.name, event.data);
    });

  } else {
    doneReplaying();
  }
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

    if (this.status === 'started' && this.gameController && player) {
      this.gameController.registerPlayerEmitter(user.id, socket);
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
  if (this.game) {
    var data = gameSerializer.serialize(this.game);
    emitter.emit('GameData', data);
  }
};

Room.prototype.startGame = function() {
  if (this.status !== 'waiting') {
    return;
  }

  var players = this.users.getPlayers();

  this.users.lock();

  this.logger.info('Starting game.');
  this.status = 'started';

  this.document.users = this.users.getPlayerIds();

  this.document.game = gameBuilder.getGame(players, this.gameOptions);
  this.document.save(this.loadGame.bind(this));
};

module.exports = Room;
