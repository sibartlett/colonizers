'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuthAttemptSchema = new Schema({
  username: { type: String, required: true },
  ip: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

AuthAttemptSchema.statics.abuseDetected = function(ip, username, callback) {
  this.count({ ip: ip }, function(err, count) {
    if (err) {
      return callback(err);
    }

    if (count > 3) {
      return callback(null, true);
    }

    var query = { ip: ip, username: username.toLowerCase() };
    this.count(query, function(err, count) {
      if (err) {
        return callback(err);
      }

      if (count > 10) {
        return callback(null, true);
      }

      callback(null, false);
    }.bind(this));
  }.bind(this));
};

module.exports = AuthAttemptSchema;
