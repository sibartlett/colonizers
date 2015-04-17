'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameEventSchema = new Schema({
  time: { type: Date, default: Date.now },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  event: {
    type: String,
    required: true
  },
  data: Schema.Types.Mixed
});

GameEventSchema.virtual('id').get(function() {
  return this._id.toString();
});

GameEventSchema.methods.toJSON = function() {
  return {
    id: this.id,
    room: this.room,
    event: this.event,
    data: this.data,
    timestamp: this.timestamp
  };
};

module.exports = GameEventSchema;
