'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  var findSession = function(criteria, callback) {
    var Session = mongoose.model('Session');
    Session.findOne(criteria).populate('user').exec(function(err, session) {
      if (err) {
        return callback(err);
      }

      if (!session || !session.user) {
        return callback(null, false);
      }

      callback(null, true, {
        session: session,
        sessionId: session._id,
        user: session.user,
        userId: session.user._id,
        scope: session.scope
      });
    });
  };

  server.auth.strategy('cookie', 'cookie', {
    password: options.cookieSecret,
    cookie: 'sid',
    isSecure: false,
    redirectTo: '/login',
    validateFunc: function(request, data, callback) {
      findSession({ type: 'web', _id: data.id, token: data.token }, callback);
    }
  });

  server.auth.strategy('basic', 'basic', {
    validateFunc: function(username, password, callback) {
      findSession({_id: username, token: password}, callback);
    }
  });

  server.ext('onPostAuth', function(request, reply) {
    var session = request.auth.credentials && request.auth.credentials.session;

    if (!session) {
      return reply.continue();
    }

    session.lastActive = Date.now();

    if (request.info.remoteAddress) {
      session.ipAddress = request.info.remoteAddress;
    }

    if (request.headers['user-agent']) {
      session.userAgent = request.headers['user-agent'];
    }

    session.save(function(err) {
      if (err) {
        return reply(err);
      }

      reply.continue();
    });
  });

  server.auth.default({
    strategies: ['basic', 'cookie']
  });

  next();
};

exports.register.attributes = {
  name: 'auth'
};
