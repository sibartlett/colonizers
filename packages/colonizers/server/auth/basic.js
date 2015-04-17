'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {
  server.auth.strategy('basic', 'basic', {
    validateFunc: function(username, password, callback) {
      var Session = mongoose.model('Session');

      Session.findOne({_id: username, token: password})
        .populate('user')
        .exec(function(err, session) {

          if (err) {
            return callback(err);
          }

          if (!session || !session.user) {
            return callback(null, false);
          }

          callback(null, true, {
            sessionId: session._id,
            userId: session.user._id
          });
        });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'basic-auth'
};
