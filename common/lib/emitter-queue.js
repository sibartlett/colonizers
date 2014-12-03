'use strict';

var async = require('async');

function EmitterQueue(source) {
  this.source = source;
  this.processTask = this.processTask.bind(this);
  this.queue = async.queue(this.processTask, 1);
}

EmitterQueue.prototype.getTasks = function(event, data) {
  var listeners;

  this.callbacks = this.callbacks || {};

  listeners = this.callbacks[event] || [];
  listeners = listeners.slice(0);

  return listeners.map(function(listener) {
    return function(next) {
      listener(data, function() {
        // next function must be called asynchronously
        // this allows us to write synchronous callbacks
        setTimeout(next, 0);
      });
    };
  });
};

EmitterQueue.prototype.processTask = function(task, next) {
  var tasks = this.getTasks(task.event, task.data);
  async.series(tasks, function() {
    // next function must be called asynchronously
    // this allows us to write synchronous callbacks
    setTimeout(next, 0);
  });
};

EmitterQueue.prototype.emit = function(event, data) {
  var task = {
    event: event,
    data: data
  };
  this.queue.push(task);
};

EmitterQueue.prototype.on = function(event, fn) {
  this.callbacks = this.callbacks || {};

  if (this.callbacks[event] == null) {
    this.callbacks[event] = [];
    this.source.on(event, function(data) {
      return this.emit(event, data);
    }.bind(this));
  }

  this.callbacks[event].push(fn);
};

EmitterQueue.prototype.onceDrain = function(fn) {
  var onDrain = function() {
    this.queue.drain = null;
    fn();
  }.bind(this);
  this.queue.drain = onDrain;
};

EmitterQueue.prototype.kill = function() {
  this.queue.kill();
};

module.exports = EmitterQueue;
