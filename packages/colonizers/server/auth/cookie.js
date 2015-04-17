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
      var id = data.session._id;
      var token = data.session.token;

      Session.findOne({_id: id, token: token})
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
  name: 'cookie-auth'
};
