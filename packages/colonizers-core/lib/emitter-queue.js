'use strict';

var async = require('async');

function EmitterQueue(source) {
  this._source = source;
  this._pre = [];
  this._post = [];
  this.processTask = this.processTask.bind(this);
  this.queue = async.queue(this.processTask, 1);
}

EmitterQueue.prototype.getTasks = function(event, data) {
  this.callbacks = this.callbacks || {};

  var listeners = this.callbacks[event] || [];

  var pres = this._pre.slice(0).map(function(pre) {
    if (pre.length === 3) {
      return function(next) {
        pre(event, data, function() {
          setTimeout(next, 0);
        });
      };
    } else {
      return function(next) {
        pre(event, data);
        setTimeout(next, 0);
      };
    }
  });

  var callbacks = listeners.slice(0).map(function(listener) {
    if (listener.length === 2) {
      return function(next) {
        listener(data, function() {
          setTimeout(next, 0);
        });
      };
    } else {
      return function(next) {
        listener(data);
        setTimeout(next, 0);
      };
    }
  });

  var posts = this._post.slice(0).map(function(post) {
    if (post.length === 3) {
      return function(next) {
        post(event, data, function() {
          setTimeout(next, 0);
        });
      };
    } else {
      return function(next) {
        post(event, data);
        setTimeout(next, 0);
      };
    }
  });

  return pres.concat(callbacks).concat(posts);
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
    if (this._source) {
      this._source.on(event, function(data) {
        return this.emit(event, data);
      }.bind(this));
    }
  }

  this.callbacks[event].push(fn);
};

EmitterQueue.prototype.pre = function(fn) {
  this._pre.push(fn);
};

EmitterQueue.prototype.post = function(fn) {
  this._post.push(fn);
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
