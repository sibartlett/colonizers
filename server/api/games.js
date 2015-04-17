'use strict';

var Boom = require('boom');
var Hoek = require('hoek');
var Joi = require('joi');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({ basePath: '' }, options);

  var RoomStore = server.plugins['room-store'].store;

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms/{roomId}/game',
    config: {
      validate: {
        params: {
          roomId: Joi.string().lowercase().required().length(24)
        }
      },
      auth: {
        strategy: 'cookie'
      }
    },
    handler: function(request, reply) {
      RoomStore.get(request.params.roomId, function(room) {
        if (!room || !room.doc.gameContext) {
          return reply(Boom.notFound());
        }

        reply(room.doc.gameContext.getState());
      });
    }
  });

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms/{roomId}/game/stream',
    config: {
      validate: {
        params: {
          roomId: Joi.string().lowercase().required().length(24)
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

        if (!room || room.status === 'open') {
          return reply(Boom.notFound());
        }

        reply(room.gameEvents);
      });
    }
  });

  server.route({
    method: 'POST',
    path: options.basePath + '/rooms/{roomId}/game/stream',
    config: {
      plugins: {
        'hapi-io': 'game-event'
      },
      validate: {
        params: {
          roomId: Joi.string().lowercase().required().length(24)
        },
        payload: {
          event: Joi.string().lowercase().required(),
          data: Joi.object().optional()
        }
      },
      auth: {
        strategy: 'cookie'
      }
    },
    handler: function(request, reply) {
      RoomStore.get(request.params.roomId, function(room) {
        if (!room || !room.doc.gameContext) {
          return reply(Boom.notFound());
        }

        room.doc.gameContext.pushEvent({
          playerId: request.auth.credentials.userId.toString(),
          event: request.payload.event,
          data: request.payload.data
        }, reply);
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/games'
};
