'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    UserId,
    RoomSchema;

UserId = {
  type: Schema.Types.ObjectId,
  ref: 'User'
};

RoomSchema = new Schema({
  owner: UserId,
  users: [UserId],
  numPlayers: Number,
  game: {
    type: Schema.Types.Mixed,
    default: null
  },
  gameEvents: [Schema.Types.Mixed],
  gameOptions: Schema.Types.Mixed
});

module.exports = RoomSchema;
