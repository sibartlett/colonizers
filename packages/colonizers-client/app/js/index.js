'use strict';

require('jquery-plugins');

var jquery = require('jquery'),
    io = require('socket.io-client'),
    core = require('colonizers-core'),
    Factory = require('./game/factory'),
    Notifications = require('./notifications'),
    UserInterface = require('./user-interface');

jquery.get('/tilesets/modern.json', function(tileset) {

  var factory = new Factory(tileset),
      socket = io(),
      gameSerializer = new core.GameSerializer(factory),
      emitterQueue = new core.EmitterQueue(socket),
      gameCoordinator = new core.GameCoordinator(emitterQueue),
      notifications = new Notifications(emitterQueue),
      ui = new UserInterface({
        socket: socket,
        emitterQueue: emitterQueue,
        notifications: notifications,
        factory: factory
      }),
      game = null;

  ui.bind();

  socket.on('room_closed', function() {
    window.location = '/lobby';
  });

  socket.on('connect', function() {
    socket.emit('room', window.roomId);
  });

  socket.on('GameData', function(data) {
    game = gameSerializer.deserialize(data);
    emitterQueue.kill();
    gameCoordinator.setGame(game);
    ui.setGame(game);
  });

});
