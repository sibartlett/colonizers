'use strict';

require('jquery-plugins');

var io = require('socket.io-client'),
    core = require('colonizers-core'),
    Factory = require('./game/factory'),
    Notifications = require('./notifications'),
    UserInterface = require('./user-interface'),

    game = null,
    factory = new Factory(),
    gameSerializer = new core.GameSerializer(factory),

    socket = io(),
    emitterQueue = new core.EmitterQueue(socket),
    gameCoordinator = new core.GameCoordinator(emitterQueue),
    notifications = new Notifications(emitterQueue),
    ui = new UserInterface(socket, emitterQueue, notifications, factory);

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
