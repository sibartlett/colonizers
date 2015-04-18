'use strict';

var Boom = require('boom');
var Hoek = require('hoek');
var Joi = require('joi');
var mongoose = require('mongoose');
var _ = require('underscore');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({ basePath: '' }, options);

  var RoomStore = server.plugins['room-store'].store;

  var findUserInIoRoom = function(io, room, userId) {
    var rooms = io.of('/').adapter.rooms;

    if (!rooms[room]) {
      return [];
    }

    var socketIds = _.map(rooms[room], function(val, key) { return key; });

    if (!socketIds.length) {
      return socketIds;
    }

    return _.some(io.sockets.sockets, function(socket) {
      return socketIds.indexOf(socket.id) !== -1 &&
             socket.credentials.userId.equals(userId);
    });
  };

  var broadcastRoomUsers = function(ctx) {
    RoomStore.get(ctx.data.id, function(room) {

      if (!room) {
        return;
      }

      room.doc.getUsers(function(err, users) {
        ctx.io.to(ctx.data.id).emit('room-users', users);
      });
    });
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
      }
    },
    handler: function(request, reply) {
      var Room = mongoose.model('Room');

      Room.findById(request.params.roomId, function(err, room) {
        if (err) {
          return reply(err);
        }

        if (!room) {
          return reply(Boom.notFound());
        }

        reply(room);
      });
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
          scenario: Joi.string().required()
                       .description('Colonizers scenario ID'),
          numPlayers: Joi.number().integer().required().min(3).max(4)
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
        'hapi-io': {
          event: 'join-room',
          post: function(ctx, next) {
            if (!ctx.result.id) {
              return next();
            }

            ctx.socket.join(ctx.data.roomId);

            ctx.socket.on('disconnect', function() {
              RoomStore.get(ctx.data.roomId, function(room) {
                if (room.doc.status !== 'open') {
                  return;
                }

                var here = findUserInIoRoom(ctx.io, ctx.data.roomId,
                                            ctx.socket.credentials.userId);

                if (!here) {
                  ctx.trigger('leave-room', ctx.data);
                }
              });
            });

            next();
            broadcastRoomUsers(ctx);
          }
        }
      },
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      }
    },
    handler: function(request, reply) {
      RoomStore.get(request.params.roomId, function(room) {
        if (!room) {
          return reply(Boom.notFound());
        }

        room.doc.join(request.auth.credentials.userId, function(err, member) {
          return reply(err, member);
        });
      });
    }
  });

  server.route({
    method: 'POST',
    path: options.basePath + '/rooms/{roomId}/leave',
    config: {
      description: 'Leaves a single room, specified by the roomId parameter.',
      plugins: {
        'hapi-io': {
          event: 'leave-room',
          post: function(ctx, next) {
            ctx.socket.leave(ctx.data.roomId);
            next();
            broadcastRoomUsers(ctx);
          }
        }
      },
      auth: {
        strategy: 'cookie'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      }
    },
    handler: function(request, reply) {
      RoomStore.get(request.params.roomId, function(room) {
        if (!room) {
          return reply(Boom.notFound());
        }

        room.doc.leave(request.auth.credentials.userId, function(err) {
          if (err) {
            return reply(err);
          }

          reply();
        });
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/rooms'
};
