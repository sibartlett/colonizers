'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var UserId = {
  type: Schema.Types.ObjectId,
  ref: 'User'
};

var SessionSchema = new Schema({
  user: UserId,
  token: { type: String, default: uuid },
  created: { type: Date, default: Date.now }
});

module.exports = SessionSchema;
