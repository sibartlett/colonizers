'use strict';

var Joi = require('joi');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  server.route({
    method: 'GET',
    path: '/logout',
    config: {
      auth: false
    },
    handler: function(request, reply) {
      var Session = mongoose.model('Session');
      var credentials = request.auth.credentials || { session: {} };
      var session = credentials.session || {};

      Session.findByIdAndRemove(session._id, function(err) {
        if (err) {
          return reply(err);
        }

        request.auth.session.clear();
        reply.redirect('/');
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/login',
    config: {
      auth: {
        mode: 'try',
        strategy: 'cookie'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function(request, reply) {
      if (request.auth.isAuthenticated) {
        return reply.redirect('/lobby');
      }

      reply.view('login/index', {
        script: 'login/public'
      }).header('x-auth-required', true);
    }
  });

  server.route({
    method: 'POST',
    path: '/login',
    config: {
      validate: {
        payload: {
          username: Joi.string().lowercase().required(),
          password: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      auth: {
        mode: 'try',
        strategy: 'cookie'
      },
      pre: [{
        assign: 'abuseDetected',
        method: function(request, reply) {
          var AuthAttempt = mongoose.model('AuthAttempt');
          var ip = request.info.remoteAddress;
          var username = request.payload.username;

          AuthAttempt.abuseDetected(ip, username, function(err, detected) {
            if (err) {
              return reply(err);
            }

            if (detected) {
              return reply({
                message: 'Maximum number of auth attempts reached. Please try again later.'
              }).takeover().code(400);
            }

            reply();
          });
        }
      }, {
        assign: 'user',
        method: function(request, reply) {
          var User = mongoose.model('User');
          var username = request.payload.username;
          var password = request.payload.password;

          User.authenticate(username, password, function(err, user) {
            if (err) {
              return reply(err);
            }

            reply(err || user);
          });
        }
      }, {
        assign: 'logAttempt',
        method: function(request, reply) {
          if (request.pre.user) {
            return reply();
          }

          var AuthAttempt = mongoose.model('AuthAttempt');
          var ip = request.info.remoteAddress;
          var username = request.payload.username;

          AuthAttempt.create({ ip: ip, username: username},
                             function(err) {
            if (err) {
              return reply(err);
            }

            return reply({
              message: 'Username and password combination not found ' +
                       'or account is inactive.'
            }).takeover().code(400);
          });
        }
      }, {
        assign: 'session',
        method: function(request, reply) {
          var Session = mongoose.model('Session');

          Session.create({
            user: request.pre.user._id
          }, function(err, session) {
            if (err) {
              return reply(err);
            }

            return reply(session);
          });
        }
      }]
    },
    handler: function(request, reply) {
      request.auth.session.set(request.pre.session);
      reply(request.pre.session);
    }
  });

  server.route({
    method: 'POST',
    path: '/signup',
    config: {
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      auth: {
        mode: 'try',
        strategy: 'cookie'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          username: Joi.string().token().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'usernameCheck',
        method: function(request, reply) {
          var User = mongoose.model('User');

          var conditions = {
            username: request.payload.username
          };

          User.findOne(conditions, function(err, user) {
            if (err) {
              return reply(err);
            }

            if (user) {
              var response = {
                message: 'Username already in use.'
              };

              return reply(response).takeover().code(409);
            }

            reply(true);
          });
        }
      }, {
        assign: 'emailCheck',
        method: function(request, reply) {
          var User = mongoose.model('User');
          var conditions = {
            email: request.payload.email
          };

          User.findOne(conditions, function(err, user) {
            if (err) {
              return reply(err);
            }

            if (user) {
              var response = {
                message: 'Email already in use.'
              };

              return reply(response).takeover().code(409);
            }

            reply(true);
          });
        }
      }, {
        assign: 'user',
        method: function(request, reply) {
          var User = mongoose.model('User');
          var user = new User({
            username: request.payload.username,
            email: request.payload.email,
            name: request.payload.name,
            password: request.payload.password
          });

          user.save(function(err) {
            reply(err || user);
          });
        }
      }, {
        assign: 'session',
        method: function(request, reply) {
          var Session = mongoose.model('Session');
          Session.create({
            user: request.pre.user._id
          }, reply);
        }
      }]
    },
    handler: function(request, reply) {
      request.auth.session.set(request.pre.session);
      reply(request.pre.session);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web/login'
};
