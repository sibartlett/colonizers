'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {
  server.auth.strategy('cookie', 'cookie', {
    password: options.password,
    cookie: 'sid',
    isSecure: false,
    redirectTo: '/login',
    validateFunc: function(data, callback) {
      var Session = mongoose.model('Session');
      var id = data.id;
      var token = data.token;

      Session.authenticate({_id: id, token: token}, function(err, session) {
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
  name: 'cookie-auth'
};
