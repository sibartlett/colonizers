'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuthAttemptSchema = new Schema({
  username: { type: String, required: true },
  ip: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

AuthAttemptSchema.statics.abuseDetected = function(ip, username, callback) {
  this.count(
    { ip: ip },
    function(err, count) {
      if (err) {
        return callback(err);
      }

      if (count > 3) {
        return callback(null, true);
      }

      var query = { ip: ip, username: username.toLowerCase() };
      this.count(query, function(err2, count2) {
        if (err2) {
          return callback(err2);
        }

        if (count2 > 10) {
          return callback(null, true);
        }

        callback(null, false);
      });
    }.bind(this)
  );
};

module.exports = AuthAttemptSchema;
