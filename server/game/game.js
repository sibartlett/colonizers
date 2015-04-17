'use strict';

exports.register = function(server, options, next) {
  var RoomStore = server.plugins['room-store'].store;
  var io = server.plugins['hapi-io'].io;

  io.on('connection', function(socket) {
    socket.on('join-game', function(roomId) {
      RoomStore.get(roomId, function(room) {
        if (!room) {
          return socket.emit('room_closed');
        }

        room.doc.sendGameData(socket);
        socket.join('game/' + roomId);
      });
    });
  });

  next();
};

exports.register.attributes = {
  name: 'game'
};
