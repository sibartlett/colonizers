'use strict';

var EmitterQueue = require('../../colonizers-core/lib/emitter-queue');
var GameContext = require('../../colonizers-core/lib/game-context');
var Client = require('../../colonizers-client');
var Factory = Client.Factory;
var tileset = require('../../colonizers-client/public/tilesets/modern.json');

var state = {};
var players = [
  {
    id: 'id1',
    name: 'Player 1'
  },
  {
    id: 'id2',
    name: 'Player 2'
  },
  {
    id: 'id3',
    name: 'Player 3'
  }
];

var queue = new EmitterQueue();
var factory = new Factory({
  tileset: tileset
});

var options = {
  factory: factory,
  players: players,
  gameOptions: {
    numPlayers: 3,
    scenario: 'default'
  },
  postEvent: function(event, data, next) {
    queue.emit(event, data);
    next();
  }
};

var client = new Client({
  factory: factory,
  tileset: tileset,
  emitterQueue: queue,
  clientUsers: players.map(function(user) {
    return user.id;
  }),
  emitEvent: function(playerId, event, data) {
    state.gameContext.pushEvent({
      playerId: playerId,
      event: event,
      data: data
    });
  }
});

client.setUsers(players);

state.gameContext = GameContext.fromScenario(options, function(g) {
  client.setGame(g.game);
  g.start();
});
