'use strict';

var Boom = require('boom');
var Hoek = require('hoek');
var Joi = require('joi');
var mongoose = require('mongoose');
var _ = require('underscore');

exports.register = function(server, options, next) {
  options = Hoek.applyToDefaults({ basePath: '' }, options);

  var broadcastUsers = function(roomId) {
    var Room = mongoose.model('Room');
    var pubsub = server.plugins.pubsub;

    Room.getUsers(roomId, function(err, users) {
      if (err) {
        return;
      }

      pubsub.publish({
        room: roomId,
        event: 'room-users',
        data: users
      });
    });
  };

  var io = server.plugins['hapi-io'].io;

  io.on('connection', function(socket) {
    socket.on('enter-room', function(data) {
      socket.join(data.roomId);
      broadcastUsers(data.roomId);
    });
  });

  var getRoom = function(opts) {
    opts = opts || {};

    return function(request, reply) {
      var Room = mongoose.model('Room');

      var find = Room.findById(request.params.roomId);

      if (opts.users) {
        find.populate('users.user');
      }

      find.exec(function(err, room) {
        if (err) {
          return reply(err);
        }

        if (!room) {
          return reply(Boom.notFound());
        }

        reply(room);
      });
    };
  };

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms',
    config: {
      description: 'Returns a list of rooms.',
      plugins: {
        'hapi-io': 'rooms'
      },
      auth: {
        strategy: 'cookie'
      }
    },
    handler: function(request, reply) {
      var Room = mongoose.model('Room');

      Room.find({})
        .populate('users.user')
        .sort('-created')
        .select('_id users created gameOptions')
        .exec(function(err, rooms) {
          if (err) {
            return reply(err);
          }

          reply(rooms);
        });
    }
  });

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms/{roomId}',
    config: {
      description: 'Returns a single room, specified by the roomId parameter.',
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      },
      auth: {
        strategy: 'cookie'
      },
      pre: [
        {
          assign: 'room',
          method: getRoom()
        }
      ]
    },
    handler: function(request, reply) {
      reply(request.pre.room);
    }
  });

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms/{roomId}/users',
    config: {
      description:
        'Returns a list of users for a single room, ' +
        'specified by the roomId parameter.',
      plugins: {
        'hapi-io': 'room-users'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      },
      auth: {
        strategy: 'cookie'
      },
      pre: [
        {
          assign: 'room',
          method: getRoom({ users: true })
        }
      ]
    },
    handler: function(request, reply) {
      var users = _.map(request.pre.room.users, function(user) {
        return user.user;
      });

      reply(users);
    }
  });

  server.route({
    method: 'POST',
    path: options.basePath + '/rooms',
    config: {
      description: 'Creates a room.',
      plugins: {
        'hapi-io': 'create-room'
      },
      auth: {
        strategy: 'cookie'
      },
      validate: {
        payload: {
          scenario: Joi.string()
            .required()
            .description('Colonizers scenario ID'),
          numPlayers: Joi.number()
            .integer()
            .required()
            .min(3)
            .max(4)
            .description('Number of players')
        }
      }
    },
    handler: function(request, reply) {
      var Room = mongoose.model('Room');

      var data = {
        owner: request.auth.credentials.userId,
        numPlayers: request.payload.numPlayers,
        gameOptions: {
          numPlayers: request.payload.numPlayers,
          scenario: request.payload.scenario
        }
      };

      Room.create(data, function(err, room) {
        if (err) {
          return reply(err);
        }

        reply(room);
      });
    }
  });

  server.route({
    method: 'POST',
    path: options.basePath + '/rooms/{roomId}/join',
    config: {
      description: 'Joins a single room, specified by the roomId parameter.',
      plugins: {
        'hapi-io': 'join-room'
      },
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      },
      pre: [
        {
          assign: 'room',
          method: getRoom()
        },
        {
          assign: 'autoStart',
          method: function(request, reply) {
            function autoStart(pubsub, roomId) {
              return function() {
                var Room = mongoose.model('Room');

                Room.findById(roomId, function(err, room) {
                  if (err || !room) {
                    return;
                  }

                  room.start(function() {
                    pubsub.publish({
                      room: room.id,
                      event: 'game-started'
                    });
                  });
                });
              };
            }

            reply(autoStart(server.plugins.pubsub, request.params.roomId));
          }
        }
      ]
    },
    handler: function(request, reply) {
      var room = request.pre.room;
      room.join(request.auth.credentials.userId, function(err, member) {
        if (err) {
          return reply(err);
        }

        if (member && room.users.length === room.numPlayers) {
          setTimeout(request.pre.autoStart, 2000);
        }

        reply(member);
        broadcastUsers(room.id);
      });
    }
  });

  server.route({
    method: 'POST',
    path: options.basePath + '/rooms/{roomId}/leave',
    config: {
      description: 'Leaves a single room, specified by the roomId parameter.',
      plugins: {
        'hapi-io': 'leave-room'
      },
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      },
      pre: [
        {
          assign: 'room',
          method: getRoom()
        }
      ]
    },
    handler: function(request, reply) {
      var room = request.pre.room;
      room.leave(request.auth.credentials.userId, function(err) {
        if (err) {
          return reply(err);
        }

        reply();
        broadcastUsers(room.id);
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/rooms'
};
