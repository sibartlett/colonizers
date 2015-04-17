'use strict';

var async = require('async');
var Emitter = require('component-emitter');
var EmitterQueue = require('./emitter-queue');
var Factory = require('./factory');
var GameCoordinator = require('./game-coordinator');
var GameSerializer = require('./game-serializer');
var GameBuilder = require('./game-builder');
var GameController = require('./controller');

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
  var factory = options.factory || new Factory();

  this.gameSerializer = new GameSerializer(factory);
  this.game = this.gameSerializer.deserialize(options.game);

  var emitter = new Emitter();
  var emitterQueue = new EmitterQueue(emitter);

  var contextEmitter = new ContextEmitter(options.saveEvent, [
    emitter,
    options.emitEventsTo
  ]);

  var doneReplaying = function() {
    this.controller = new GameController(this.game, contextEmitter);
    if (done) {
      done(this);
    }
  }.bind(this);

  this.coordinator = new GameCoordinator(emitterQueue, this.game);

  var events = options.events || [];

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
  var gameBuilder = new GameBuilder();
  var game = gameBuilder.getGame(options.players, options.gameOptions);

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
