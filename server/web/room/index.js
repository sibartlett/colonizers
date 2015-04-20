'use strict';

var Joi = require('joi');

exports.register = function(server, options, next) {

  var RoomStore = server.plugins['room-store'].store;

  server.route({
    method: 'GET',
    path: '/room/{room}',
    config: {
      validate: {
        params: {
          room: Joi.string().required()
        }
      }
    },
    handler: function(request, reply) {
      RoomStore.get(request.params.room, function(room) {
        if (room.doc.status === 'open') {
          reply.view('room/room',  {
            context: {
              roomId: request.params.room,
              userId: request.auth.credentials.userId
            },
            script: 'room/room'
          });
        } else {
          reply.view('room/game',  {
            context: {
              roomId: request.params.room,
              userId: request.auth.credentials.userId
            },
            script: 'room/game'
          }, {
            layout: false
          });
        }
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web/room'
};
