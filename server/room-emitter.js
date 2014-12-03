'use strict';

var async = require('async');

function RoomEmitter(document, emitters) {
  this.document = document;
  this.emitters = emitters;
  this.queue = async.queue(this.processTask.bind(this), 1);
}

RoomEmitter.prototype.processTask = function(task, next) {
  var cb = function() {
    this.emitters.forEach(function(emitter) {
      emitter.emit(task.event, task.data);
    });
    next();
  };
  this.save(task.event, task.data, cb.bind(this));
};

RoomEmitter.prototype.save = function(event, data, cb) {
  this.document.gameEvents.push({
    name: event,
    data: data
  });
  this.document.save(cb);
};

RoomEmitter.prototype.emit = function(event, data) {
  this.queue.push({
    event: event,
    data: data || {}
  });
};

module.exports = RoomEmitter;
