'use strict';

function PlayerRequest(logger, playerId, emitter, data) {
  this.logger = logger;
  this.playerId = playerId;
  this.emitter = emitter;
  this.emit = this.emit.bind(this);
  this.data = data || {};
}

PlayerRequest.prototype.emit = function(event, data) {
  if (this.logger) {
    this.logger.info('Controller emitting event.', {
      event: event,
      data: data
    });
  }
  this.emitter.emit(event, data);
};

module.exports = PlayerRequest;
