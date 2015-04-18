'use strict';

var Boom = require('boom');
var Hoek = require('hoek');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({ basePath: '' }, options);

  server.route({
    method: 'GET',
    path: options.basePath + '/account/sessions',
    config: {
      description: 'Returns a list of sessions for the current user.',
      auth: {
        strategy: 'cookie'
      }
    },
    handler: function(request, reply) {
      var Session = mongoose.model('Session');

      var criteria = { user: request.auth.credentials.userId };
      Session.find(criteria, function(err, user) {
        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });

  server.route({
    method: 'GET',
    path: options.basePath + '/account/sessions/{sessionId}',
    config: {
      description: 'Returns a single session, specified by ID.',
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          sessionId: server.plugins.validations.mongoId.required()
                           .description('Session ID')
        }
      }
    },
    handler: function(request, reply) {
      var Session = mongoose.model('Session');

      var criteria = {
        _id: request.params.sessionId,
        user: request.auth.credentials.userId
      };

      Session.findOne(criteria, function(err, session) {
        if (err) {
          return reply(err);
        }

        if (!session) {
          return reply(Boom.notFound());
        }

        reply(session);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: options.basePath + '/account/sessions/{sessionId}',
    config: {
      description: 'Deletes a single session, specified by ID.',
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          sessionId: server.plugins.validations.mongoId.required()
                           .description('Session ID')
        }
      }
    },
    handler: function(request, reply) {
      var Session = mongoose.model('Session');

      var criteria = {
        _id: request.params.sessionId,
        user: request.auth.credentials.userId
      };

      Session.remove(criteria, function(err, result) {
        if (err) {
          return reply(err);
        }

        if (!result || result.n) {
          return reply(Boom.notFound());
        }

        reply();
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/sessions'
};
