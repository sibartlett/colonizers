'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/account',
    handler: function(request, reply) {
      var User = mongoose.model('User');

      User.findById(request.auth.credentials.userId, function(err, user) {
        if (err) {
          return reply(err);
        }

        reply.view('account/index', {
          user: user,
          script: 'account/public'
        });
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web/account'
};
