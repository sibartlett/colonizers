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

RoomSchema.methods.getUsers = function(cb) {
  var User = mongoose.model('User');
  var userIds = this.users.map(function(member) {
    return member.user;
  });

  User.find({ _id: { $in: userIds } }, cb);
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

    if (this.users.length === this.numPlayers) {
      setTimeout(function() {
        this.start();
      }.bind(this), 2000);
    }
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

RoomSchema.methods.saveEvent = function(event, data, cb) {
  var GameEvent = mongoose.model('GameEvent');

  GameEvent.create({
    room: this._id,
    event: event,
    data: data
  }, cb);
};

RoomSchema.methods.sendGameData = function(emitter) {
  emitter = emitter || this.io.to('game/' + this._id.toString());

  this.getUsers(function(err, users) {
    emitter.emit('room_users', users);

    if (this.gameContext) {
      emitter.emit('GameData', this.gameContext.getState());
    }
  }.bind(this));
};

RoomSchema.methods.onContextReady = function(context) {
  context.start();
  this.io.to(this._id.toString()).emit('game-started');
};

RoomSchema.methods.start = function() {
  if (this.status !== 'open') {
    return;
  }

  if (this.users.length !== this.numPlayers) {
    return;
  }

  this.status = 'started';

  var options = {
    gameOptions: this.gameOptions,
    saveEvent: this.saveEvent.bind(this),
    emitEventsTo: this.io.to('game/' + this._id.toString()),
    players: this.users.map(function(member) {
      return {
        id: member.user.toString()
      }
    })
  };

  this.gameContext = GameContext.fromScenario(options, function(gameContext) {
    this.game = gameContext.getState();
    this.save(function() {
      this.onContextReady.bind(this)(gameContext);
    }.bind(this));
  }.bind(this));
};

RoomSchema.methods.postLoad = function() {
  if (this.status === 'open') {
    return;
  }

  var GameEvent = mongoose.model('GameEvent');

  GameEvent.find({ room: this._id}).sort('time').exec(function(err, events) {
    this.gameContext = GameContext.fromSave({

      game: this.game,
      saveEvent: this.saveEvent.bind(this),
      emitEventsTo: this.io.to('game/' + this._id.toString()),
      events: events.map(function(e) {
        return {
          name: e.event,
          data: e.data
        };
      })

    }, this.onContextReady.bind(this));
  }.bind(this));
};

module.exports = RoomSchema;
