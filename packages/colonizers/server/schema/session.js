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
  created: { type: Date, default: Date.now },
  lastActive: { type: Date }
});

SessionSchema.virtual('id').get(function() {
  return this._id.toString();
});

SessionSchema.methods.toJSON = function() {
  return {
    id: this.id,
    user: this.user,
    token: this.token,
    created: this.created,
    lastActive: this.lastActive
  };
};

SessionSchema.statics.authenticate = function(options, cb) {
  this.findOne(options).populate('user').exec(function(err, session) {
    if (err) {
      return cb(err);
    }

    if (!session) {
      return cb(err, session);
    }

    session.lastActive = Date.now();

    session.save(function(err) {
      cb(err, session);
    });
  });
};

module.exports = SessionSchema;
