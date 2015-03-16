'use strict';

var _ = require('underscore'),
    async = require('async'),
    Chance = require('chance'),
    Emitter = require('component-emitter'),
    EmitterQueue = require('../emitter-queue'),
    util = require('../util'),
    PlayerRequest = require('./request');

function SubHandler(condition) {
  this.condition = condition;
  this.handle = this.handle.bind(this);
}

SubHandler.prototype.then = function() {
  this.thens = Array.prototype.slice.call(arguments, 0);
};

SubHandler.prototype.handle = function(req, cb) {
  var yep = !this.condition || this.condition(req),
      thens;

  if (!yep) {
    return false;
  }

  thens = this.thens.map(function(func) {
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
  this.chance = new Chance();
  this.init();
}

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
