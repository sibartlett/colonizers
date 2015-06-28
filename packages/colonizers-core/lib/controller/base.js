'use strict';

var _ = require('underscore');
var async = require('async');
var MersenneTwister = require('mersenne-twister');
var EmitterQueue = require('../emitter-queue');
var PlayerRequest = require('./request');

class SubHandler {
  constructor(condition) {
    this.condition = condition;
    this.handle = this.handle.bind(this);
  }

  then() {
    this.thens = Array.prototype.slice.call(arguments, 0);
  }

  handle(req, cb) {
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
  }
}

class Handler {
  constructor() {
    this.subs = [];
    this.handle = this.handle.bind(this);
  }

  if() {
    var sub = new SubHandler(Array.prototype.slice.call(arguments, 0));
    this.subs.push(sub);
    return sub;
  }

  handle(req, next) {
    var handled = this.subs.some(function(sub) {
      return sub.handle(req, next);
    });

    if (!handled) {
      req.error('Unhandled');
      next();
    }
  }
}

class BaseController {
  constructor(game, emitter) {
    this.events = {};
    this.queue = new EmitterQueue();

    this.game = game;
    this.emitter = emitter;

    // This requires that the game is in it's fully loaded state
    this.generator = new MersenneTwister(game.seed);
    for (var i = 0; i < game.rolls; i++) {
      this.generator.random();
    }

    this.init();
  }

  d6() {
    return Math.floor(this.generator.random() * 6 + 1);
  }

  getEventNames() {
    return Object.keys(this.events);
  }

  on(event, _if) {
    if (!this.events[event]) {
      this.events[event] = new Handler();
      this.queue.on(event, this.events[event].handle);
    }

    var sub = new SubHandler(_if);
    this.events[event].subs.push(sub);
    return sub;
  }

  pushEvent(options, callback) {
    var req = new PlayerRequest({
      logger: options.logger,
      playerId: options.playerId,
      player: this.game.getPlayerById(options.playerId),
      emitter: this.emitter,
      game: this.game,
      data: options.data
    }, callback);

    this.queue.emit(options.event, req);
  }

  static extend(options) {
    var controller = function() {
      _.forEach(this.methods, function(key) {
        this[key] = this[key].bind(this);
      }, this);

      BaseController.apply(this, arguments);
    };

    controller.super_ = BaseController;
    controller.prototype = Object.create(BaseController.prototype, {
      constructor: {
        value: controller,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    controller.prototype.methods = [];

    _.forEach(options, function(value, key) {
      if (typeof value === 'function') {
        controller.prototype.methods.push(key);
      }

      controller.prototype[key] = value;
    });

    return controller;
  }
}

module.exports = BaseController;
