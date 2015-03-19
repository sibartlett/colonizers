'use strict';

require('colonizers-client/temp/jquery-plugins');

var Emitter = require('component-emitter'),
    EmitterQueue = require('colonizers-core/lib/emitter-queue'),
    GameContext = require('colonizers-core/lib/game-context'),
    Client = require('colonizers-client/app/js/client'),
    Factory = require('colonizers-client/app/js/game/factory'),
    tileset = require('colonizers-client-tilesets/public/tilesets/modern.json');

window.userId = 'id1';

var state = {};
var players = [
  {
    id: "id1",
    name: "Player 1"
  },
  {
    id: "id2",
    name: "Player 2"
  },
  {
    id: "id3",
    name: "Player 3"
  }
];

var emitter = new Emitter();
var queue = new EmitterQueue(emitter);
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
  emitEventsTo: emitter
};

var client = new Client({
  factory: factory,
  tileset: tileset,
  emitterQueue: queue,
  clientUsers: ['id1', 'id2', 'id3'],
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
