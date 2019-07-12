'use strict';

var EmitterQueue = require('./emitter-queue');
var Factory = require('./factory');
var GameCoordinator = require('./game-coordinator');
var GameSerializer = require('./game-serializer');
var GameBuilder = require('./game-builder');
var GameController = require('./controller');

class GameContext {
  constructor(options, done) {
    var factory = options.factory || new Factory();

    this.gameSerializer = new GameSerializer(factory);
    this.game = this.gameSerializer.deserialize(options.game);

    var emitterQueue = new EmitterQueue();

    var doneReplaying = () => {
      this.controller = new GameController(this.game, emitterQueue);

      if (options.preEvent) {
        emitterQueue.pre(options.preEvent);
      }

      if (options.postEvent) {
        emitterQueue.post(options.postEvent);
      }

      if (done) {
        done(this);
      }
    };

    this.coordinator = new GameCoordinator(emitterQueue, this.game);

    var events = options.events || [];

    if (events.length) {
      emitterQueue.onceDrain(doneReplaying);
      events.forEach(function(event) {
        emitterQueue.emit(event.name, event.data);
      });
    } else {
      doneReplaying();
    }
  }

  start() {
    if (this.controller) {
      this.controller.start();
    }
  }

  getState() {
    return this.gameSerializer.serialize(this.game);
  }

  pushEvent(options, callback) {
    this.controller.pushEvent(options, callback);
  }
}

GameContext.fromScenario = function(options, done) {
  var gameBuilder = new GameBuilder();
  var game = gameBuilder.getGame(options.players, options.gameOptions);

  return new GameContext({
    game: game,
    factory: options.factory,
    postEvent: options.postEvent,
    preEvent: options.preEvent
  }, done);
};

GameContext.fromSave = function(options, done) {
  return new GameContext(options, done);
};

module.exports = GameContext;
