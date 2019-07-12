'use strict';

var Boom = require('boom');
var Hoek = require('hoek');
var Joi = require('joi');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({ basePath: '' }, options);

  var io = server.plugins['hapi-io'].io;

  io.on('connection', function(socket) {
    socket.on('join-game', function(roomId) {
      socket.join('game/' + roomId);
    });
  });

  var loadRoom = function(request, reply) {
    var Room = mongoose.model('Room');

    Room.findById(request.params.roomId, function(err, room) {
      if (err) {
        return reply(err);
      }

      if (!room || room.status === 'open') {
        return reply(Boom.notFound());
      }

      reply(room);
    });
  };

  server.route({
    method: 'GET',
    path: options.basePath + '/rooms/{roomId}/game',
    config: {
      description: 'Returns the current state of a specific game.',
      plugins: {
        'hapi-io': 'get-game'
      },
      validate: {
        params: {
          roomId: server.plugins.validations.roomId.required()
        }
      },
      auth: {
        strategy: 'cookie'
      },
      pre: [{
        assign: 'room',
        method: loadRoom
      }]
    },
    handler: function(request, reply) {
      reply(request.pre.room.game);
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
      },
      pre: [{
        assign: 'room',
        method: loadRoom
      }]
    },
    handler: function(request, reply) {
      var GameEvent = mongoose.model('GameEvent');

      GameEvent.find({ room: request.pre.room._id }, function(err, events) {
        reply(err, events);
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
      },
      pre: [{
        assign: 'room',
        method: loadRoom
      }]
    },
    handler: function(request, reply) {
      var room = request.pre.room;

      var gameContext = room.getGameContext({
        postEvent: function(event, data) {
          var pubsub = server.plugins.pubsub;
          pubsub.publish({
            room: 'game/' + room.id,
            event: event,
            data: data
          });
        }
      });

      gameContext.pushEvent({
        playerId: request.auth.credentials.userId.toString(),
        event: request.payload.event,
        data: request.payload.data
      }, reply);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'api/games'
};
