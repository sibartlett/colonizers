'use strict';

class PlayerRequest {
  constructor(options, callback) {
    this.event = options.event;
    this.data = options.data || {};

    this.game = options.game;
    this.player = options.player;
    this.playerId = options.playerId;

    this.emitter = options.emitter;
    this.callback = callback;

    this.events = [];

    this.addEvent = this.addEvent.bind(this);
    this._emitEvents = this._emitEvents.bind(this);
    this.done = this.done.bind(this);
    this.error = this.error.bind(this);
  }

  addEvent(event, data) {
    this.events.push({
      event: event,
      data: data
    });
    return this;
  }

  _emitEvents() {
    this.events.forEach(function(event) {
      this.emitter.emit(event.event, event.data);
    }, this);
  }

  done() {
    this._emitEvents();
    if (this.callback) {
      this.callback({
        success: true
      });
    }
  }

  error(error) {
    if (this.callback) {
      this.callback({
        success: false,
        error: error
      });
    }
  }
}

module.exports = PlayerRequest;
