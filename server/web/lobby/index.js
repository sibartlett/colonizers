'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {

  server.route({
    method: 'GET',
    path: '/lobby',
    handler: function(request, reply) {
      var Room = mongoose.model('Room');
      Room.find({})
        .populate('users', '_id, name')
        .sort('-created')
        .select('_id created gameOptions')
        .exec(function(err, rooms) {
          if (err) {
            return reply(err);
          }

          rooms.forEach(function(room) {
            room.url = '/room/' + room._id;
          }, this);

          reply.view('lobby/index',  {
            rooms: rooms,
            script: 'lobby/public'
          });
        });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web/lobby'
};
