'use strict';

function PlayerRequest(options, callback) {
  this.event = options.event;
  this.data = options.data || {};

  this.game = options.game;
  this.player = options.player;
  this.playerId = options.playerId;

  this.logger = options.logger;
  this.emitter = options.emitter;
  this.callback = callback;

  this.events = [];

  this.addEvent = this.addEvent.bind(this);
  this._emitEvents = this._emitEvents.bind(this);
  this.done = this.done.bind(this);
  this.error = this.error.bind(this);
}

PlayerRequest.prototype.addEvent = function(event, data) {
  this.events.push({
    event: event,
    data: data
  });
  return this;
};

PlayerRequest.prototype._emitEvents = function() {
  this.events.forEach(function(event) {
    if (this.logger) {
      this.logger.info('Controller emitting event.', event);
    }
    this.emitter.emit(event.event, event.data);
  }, this);
};

PlayerRequest.prototype.done = function() {
  this._emitEvents();
  if (this.callback) {
    this.callback({
      success: true
    });
  }
};

PlayerRequest.prototype.error = function(error) {
  if (this.callback) {
    this.callback({
      success: false,
      error: error
    });
  }
};

module.exports = PlayerRequest;
