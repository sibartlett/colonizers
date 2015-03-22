'use strict';

var Room = require('./room');

function RoomManager(options) {
  this.db = options.db;
  this.io = options.io;
  this.logger = options.logger;
  this.urlFactory = options.urlFactory;
  this.rooms = {};
  this.roomPromises = {};
}

RoomManager.prototype.getRooms = function(cb) {
  var onExec = function(err, rooms) {
    rooms.forEach(function(room) {
      room.url = this.urlFactory(room._id);
    }, this);
    cb(err, rooms);
  };

  this.db.model('Room')
    .find({})
    .populate('users', '_id, name')
    .sort('-created')
    .select('_id created gameOptions')
    .exec(onExec.bind(this));
};

RoomManager.prototype.getRoom = function(roomId, cb) {
  var RoomSchema = this.db.model('Room'),
      promise;

  if (this.rooms[roomId] == null && this.roomPromises[roomId] == null) {

    promise = function(resolve, reject) {
      this.logger.info('Fetching room from DB', {
        roomId: roomId
      });

      var findCb = function(err, doc) {
        if (err) {
          reject(err);
        }
        else if (doc) {
          this.logger.info('Room fetched from DB', {
            roomId: roomId
          });
          var roomLogger = this.logger.child({
            roomId: roomId
          });
          this.rooms[roomId] = new Room(this.io, doc, roomLogger);
          resolve(this.rooms[roomId]);
        } else {
          resolve(null);
          this.roomPromises[roomId] = null;
        }
      };

      RoomSchema.findById(roomId)
        .populate('users')
        .exec(findCb.bind(this));
    };

    this.roomPromises[roomId] = new Promise(promise.bind(this));
  }

  if (this.rooms[roomId]) {
    return cb(this.rooms[roomId]);

  } else if (this.roomPromises[roomId]) {
    return this.roomPromises[roomId].then(cb);
  }
};

RoomManager.prototype.create = function(options, cb) {
  var RoomSchema = this.db.model('Room'),
      user = options.user,
      numPlayers = options.numPlayers,
      gameOptions = options.gameOptions,
      doc,
      onSave;

  doc = new RoomSchema({
    owner: user._id,
    numPlayers: numPlayers,
    gameOptions: gameOptions
  });

  onSave = function(err) {
    var roomLogger,
        room;

    if (err) {
      cb(err);
      return;
    }

    roomLogger = this.logger.child({
      roomId: doc._id.toString()
    });

    room = new Room(this.io, doc, roomLogger);
    room.owner = user;
    room.gameOptions = gameOptions;
    room.scenario = gameOptions.scenario;
    room.numPlayers = gameOptions.numPlayers;
    this.rooms[room.id] = room;

    cb(null, room);
  };

  doc.save(onSave.bind(this));
};

RoomManager.prototype.joinRoom = function(roomId, socket) {
  this.getRoom(roomId, function(room) {
    if (room) {
      room.join(socket);
    } else {
      socket.emit('room_closed');
    }
  });
};

module.exports = RoomManager;
