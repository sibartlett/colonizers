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
      description: 'Returns the current state of a specific game.',
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
      description: 'Returns a list of events for a specific game.',
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
      description: 'Triggers an event for a specific game.',
      plugins: {
        'hapi-io': 'game-event'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        },
        payload: {
          event: Joi.string().lowercase().required().description('Event name'),
          data: Joi.object().optional().description('Event data')
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
