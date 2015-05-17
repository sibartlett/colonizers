'use strict';

var mongoose = require('mongoose');
var _ = require('underscore');
var GameContext = require('colonizers-core/lib/game-context');
var Schema = mongoose.Schema;

var UserId = {
  type: Schema.Types.ObjectId,
  ref: 'User'
};

var MembershipSchema = new Schema({
  user: UserId,
  date: { type: Date, default: Date.now }
});

MembershipSchema.virtual('id').get(function() {
  return this._id.toString();
});

MembershipSchema.methods.toJSON = function() {
  return {
    id: this.id,
    user: this.user,
    date: this.date
  };
};

var RoomSchema = new Schema({
  created: { type: Date, default: Date.now },
  owner: UserId,
  status: {
    type: String,
    default: 'open',
    enum: ['open', 'started', 'finished']
  },
  users: [MembershipSchema],
  numPlayers: Number,
  game: {
    type: Schema.Types.Mixed,
    default: null
  },
  gameOptions: Schema.Types.Mixed
});

RoomSchema.virtual('id').get(function() {
  return this._id.toString();
});

RoomSchema.methods.toJSON = function() {
  return {
    id: this.id,
    owner: this.owner,
    users: this.users,
    numPlayers: this.numPlayers,
    gameOptions: this.gameOptions
  };
};

RoomSchema.methods.join = function(userId, cb) {
  if (userId === 'string') {
    userId = mongoose.Types.ObjectId(userId);
  }

  var member = _.find(this.users, function(member) {
    return member.user.equals(userId);
  });

  if (member) {
    return cb(null, member);
  }

  member = {
    user: userId,
    date: Date.now()
  };

  this.users.push(member);

  this.save(function(err) {
    if (err) {
      return cb(err);
    }

    var result = _.find(this.users, function(member) {
      return member.user.equals(userId);
    });

    cb(null, result);
  }.bind(this));
};

RoomSchema.methods.leave = function(userId, cb) {
  var member = _.find(this.users, function(member) {
    return member.user.equals(userId);
  });

  if (!member) {
    return cb();
  }

  if (this.status !== 'open') {
    return cb('Game has already started.');
  }

  this.users.pull({ _id: member._id });

  this.save(function(err) {
    if (err) {
      return cb(err);
    }

    cb(err, member);
  });
};

RoomSchema.methods.preEvent = function(event, data, next) {
  var GameEvent = mongoose.model('GameEvent');

  GameEvent.create({
    room: this._id,
    event: event,
    data: data
  }, next);
};

RoomSchema.methods.postEvent = function(event, data, next) {
  this.game = this.gameContext.getState();
  this.save(next);
};

RoomSchema.methods.start = function(callback) {
  if (this.status !== 'open') {
    return;
  }

  if (this.users.length !== this.numPlayers) {
    return;
  }

  this.status = 'started';

  var options = {
    gameOptions: this.gameOptions,
    preEvent: this.preEvent.bind(this),
    postEvent: this.postEvent.bind(this),
    players: this.users.map(function(member) {
      return {
        id: member.user.toString()
      };
    })
  };

  this.gameContext = GameContext.fromScenario(options, function(gameContext) {
    this.gameContext = gameContext;
    this.game = gameContext.getState();
    this.save(function() {
      this.gameContext.start();
      if (callback) {
        callback(this);
      }
    }.bind(this));
  }.bind(this));
};

RoomSchema.methods.getGameContext = function(options) {
  if (this.status === 'open') {
    return undefined;
  }

  if (this.gameContext) {
    return this.gameContext;
  }

  this.gameContext = GameContext.fromSave({
    game: this.game,
    preEvent: this.preEvent.bind(this),
    postEvent: [this.postEvent.bind(this), options.postEvent]
  });

  return this.gameContext;
};

RoomSchema.statics.getUsers = function(roomId, callback) {
  this.findById(roomId).populate('users.user').exec(function(err, room) {

    if (err || !room) {
      return callback(err, room);
    }

    var users = room.users.map(function(member) {
      return member.user;
    });

    callback(err, users);
  });
};

module.exports = RoomSchema;
