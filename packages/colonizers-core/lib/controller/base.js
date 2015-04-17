'use strict';

var _ = require('underscore');
var async = require('async');
var MersenneTwister = require('mersenne-twister');
var Emitter = require('component-emitter');
var EmitterQueue = require('../emitter-queue');
var util = require('../util');
var PlayerRequest = require('./request');

function SubHandler(condition) {
  this.condition = condition;
  this.handle = this.handle.bind(this);
}

SubHandler.prototype.then = function() {
  this.thens = Array.prototype.slice.call(arguments, 0);
};

SubHandler.prototype.handle = function(req, cb) {
  var yep = !this.condition || this.condition(req);

  if (!yep) {
    return false;
  }

  var thens = this.thens.map(function(func) {
    return function(next) {
      func(req, next);
    };
  });

  async.waterfall(thens, function(err) {
    if (err) {
      req.error(err);
      return cb();
    }

    req.done();
    cb();
  });

  return true;
};

function Handler() {
  this.subs = [];
  this.handle = this.handle.bind(this);
}

Handler.prototype.if = function() {
  var sub = new SubHandler(Array.prototype.slice.call(arguments, 0));
  this.subs.push(sub);
  return sub;
};

Handler.prototype.handle = function(req, next) {
  var handled = this.subs.some(function(sub) {
    return sub.handle(req, next);
  });

  if (!handled) {
    req.error('Unhandled');
    next();
  }
};

function BaseController(game, emitter) {
  this.events = {};
  this._emitter = new Emitter();
  this.queue = new EmitterQueue(this._emitter);

  this.game = game;
  this.emitter = emitter;

  // This requires that the game is in it's fully loaded state
  this.generator = new MersenneTwister(game.seed);
  for (var i = 0; i < game.rolls; i++) {
    this.generator.random();
  }

  this.init();
}

BaseController.prototype.d6 = function() {
  return Math.floor(this.generator.random() * 6 + 1);
};

BaseController.prototype.getEventNames = function() {
  return Object.keys(this.events);
};

BaseController.prototype.on = function(event, _if) {
  if (!this.events[event]) {
    this.events[event] = new Handler();
    this.queue.on(event, this.events[event].handle);
  }

  var sub = new SubHandler(_if);
  this.events[event].subs.push(sub);
  return sub;
};

BaseController.prototype.pushEvent = function(options, callback) {
  var req = new PlayerRequest({
    logger: options.logger,
    playerId: options.playerId,
    player: this.game.getPlayerById(options.playerId),
    emitter: this.emitter,
    game: this.game,
    data: options.data
  }, callback);

  this._emitter.emit(options.event, req);
};

BaseController.extend = function(options) {
  var controller = function() {
    _.forEach(this.methods, function(key) {
      this[key] = this[key].bind(this);
    }, this);

    BaseController.apply(this, arguments);
  };

  util.inherits(controller, BaseController);

  controller.prototype.methods = [];

  _.forEach(options, function(value, key) {
    if (typeof value === 'function') {
      controller.prototype.methods.push(key);
    }

    controller.prototype[key] = value;
  });

  return controller;
};

module.exports = BaseController;
