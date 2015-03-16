'use strict';

var async = require('async'),
    Emitter = require('component-emitter'),
    EmitterQueue = require('./emitter-queue'),
    Factory = require('./factory'),
    GameCoordinator = require('./game-coordinator'),
    GameSerializer = require('./game-serializer'),
    GameBuilder = require('./game-builder'),
    GameController = require('./controller');

function ContextEmitter(saveEvent, emitters) {
  this.saveEvent = saveEvent;
  this.emitters = emitters;
  this.queue = async.queue(this.processTask.bind(this), 1);
}

ContextEmitter.prototype.processTask = function(task, next) {
  var cb = function() {
    this.emitters.forEach(function(emitter) {
      emitter.emit(task.event, task.data);
    });
    next();
  }.bind(this);

  if (this.saveEvent) {
    this.saveEvent(task.event, task.data, cb);
  } else {
    cb();
  }
};

ContextEmitter.prototype.emit = function(event, data) {
  this.queue.push({
    event: event,
    data: data || {}
  });
};

function GameContext(options, done) {
  var events = options.events || [],
      factory = options.factory || new Factory(),
      emitter,
      emitterQueue,
      doneReplaying,
      contextEmitter;

  this.gameSerializer = new GameSerializer(factory);
  this.game = this.gameSerializer.deserialize(options.game);

  emitter = new Emitter();
  emitterQueue = new EmitterQueue(emitter);

  contextEmitter = new ContextEmitter(options.saveEvent, [
    emitter,
    options.emitEventsTo
  ]);

  doneReplaying = function() {
    this.controller = new GameController(this.game, contextEmitter);
    if (done) {
      done(this);
    }
  }.bind(this);

  this.coordinator = new GameCoordinator(emitterQueue, this.game);

  if (events.length) {
    emitterQueue.onceDrain(doneReplaying);
    events.forEach(function(event) {
      emitter.emit(event.name, event.data);
    });
  } else {
    doneReplaying();
  }
}

GameContext.prototype.start = function() {
  if (this.controller) {
    this.controller.start();
  }
};

GameContext.prototype.getState = function() {
  return this.gameSerializer.serialize(this.game);
};

GameContext.prototype.pushEvent = function(options, callback) {
  this.controller.pushEvent(options, callback);
};

GameContext.fromScenario = function(options, done) {
  var gameBuilder = new GameBuilder(),
      game = gameBuilder.getGame(options.players, options.gameOptions);

  return new GameContext({
    game: game,
    factory: options.factory,
    emitEventsTo: options.emitEventsTo,
    saveEvent: options.saveEvent
  }, done);
};

GameContext.fromSave = function(options, done) {
  return new GameContext(options, done);
};

module.exports = GameContext;
