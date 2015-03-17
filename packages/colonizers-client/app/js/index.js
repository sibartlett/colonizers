'use strict';

require('jquery-plugins');

var jquery = require('jquery'),
    io = require('socket.io-client'),
    Client = require('./client'),
    GameSerializer = require('colonizers-core/lib/game-serializer'),
    EmitterQueue = require('colonizers-core/lib/emitter-queue'),
    GameCoordinator = require('colonizers-core/lib/game-coordinator'),
    Factory = require('./game/factory');

jquery.get('/tilesets/modern.json', function(tileset) {

  var socket = io(),
      emitterQueue = new EmitterQueue(socket),
      factory = new Factory(tileset),
      gameCoordinator = new GameCoordinator(emitterQueue),
      game,
      client;

  client = new Client({
    factory: factory,
    tileset: tileset,
    socket: socket,
    emitterQueue: emitterQueue
  });

  client.bindUI();

  socket.on('room_closed', function() {
    window.location = '/lobby';
  });

  socket.on('connect', function() {
    socket.emit('room', window.roomId);
  });

  socket.on('room_users', function(users) {
    client.setUsers(users);
  });

  socket.on('GameData', function(data) {
    game = new GameSerializer(factory).deserialize(data);
    emitterQueue.kill();
    gameCoordinator.setGame(game);
    client.setGame(game);
  });
});
