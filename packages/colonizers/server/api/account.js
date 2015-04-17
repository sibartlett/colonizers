'use strict';

var Joi = require('joi');
var Hoek = require('hoek');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({ basePath: '' }, options);

  server.route({
    method: 'GET',
    path: options.basePath + '/account',
    config: {
      plugins: {
        'hapi-io': 'account'
      },
      auth: {
        strategy: 'cookie'
      }
    },
    handler: function(request, reply) {
      var User = mongoose.model('User');

      User.findById(request.auth.credentials.userId, function(err, user) {
        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: options.basePath + '/account',
    config: {
      auth: {
        strategy: 'cookie'
      },
      validate: {
        payload: {
          username: Joi.string().required(),
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          password: Joi.string().optional().allow(''),
          password2: Joi.string().optional().allow('')
        }
      }
    },
    handler: function(request, reply) {
      var User = mongoose.model('User');

      User.findById(request.auth.credentials.userId, function(err, user) {
        if (err) {
          return reply(err);
        }

        user.set('username', request.payload.username);
        user.set('name', request.payload.name);
        user.set('email', request.payload.email);

        if (request.payload.password) {
          user.setPassword(request.payload.password);
        }

        user.save(function(err) {
          if (err) {
            return reply(err);
          }

          reply(user);
        });
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/account'
};
