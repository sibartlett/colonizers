'use strict';

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: false
    },
    handler: function(request, reply) {
      if (request.auth.isAuthenticated) {
        return reply.redirect('/lobby');
      }

      reply.redirect('/login');
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web/index'
};
