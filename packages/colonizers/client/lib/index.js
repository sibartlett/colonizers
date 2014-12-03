'use strict';

require('jquery-plugins');

var io = require('socket.io-client'),
    common = require('./../../common/index'),
    Factory = require('./game/factory'),
    Notifications = require('./notifications'),
    UserInterface = require('./user-interface'),

    game = null,
    factory = new Factory(),
    gameSerializer = new common.GameSerializer(factory),

    socket = io(),
    emitterQueue = new common.EmitterQueue(socket),
    gameCoordinator = new common.GameCoordinator(emitterQueue),
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
