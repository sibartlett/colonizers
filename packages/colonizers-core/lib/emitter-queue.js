'use strict';

var async = require('async');

class EmitterQueue {
  constructor(source) {
    this._source = source;
    this.callbacks = {};
    this._pre = [];
    this._post = [];
    this.processTask = this.processTask.bind(this);
    this.queue = async.queue(this.processTask, 1);
  }

  getTasks(event, data) {
    var listeners = this.callbacks[event] || [];

    var pres = this._pre.slice(0).map(function(pre) {
      return function(next) {
        pre(event, data, function() {
          setTimeout(next, 0);
        });
      };
    });

    var callbacks = listeners.slice(0).map(function(listener) {
      return function(next) {
        listener(data, function() {
          setTimeout(next, 0);
        });
      };
    });

    var posts = this._post.slice(0).map(function(post) {
      return function(next) {
        post(event, data, function() {
          setTimeout(next, 0);
        });
      };
    });

    if (!callbacks.length) {
      return [];
    }

    return pres.concat(callbacks).concat(posts);
  }

  processTask(task, next) {
    var tasks = this.getTasks(task.event, task.data);
    async.series(tasks, function() {
      // next function must be called asynchronously
      // this allows us to write synchronous callbacks
      setTimeout(next, 0);
    });
  }

  emit(event, data) {
    var task = {
      event: event,
      data: data
    };
    this.queue.push(task);
  }

  on(event, fn) {
    if (this.callbacks[event] == null) {
      this.callbacks[event] = [];
      if (this._source) {
        this._source.on(event, (data) => {
          this.emit(event, data);
        });
      }
    }

    this.callbacks[event].push(fn);
  }

  pre(fn) {
    fn = Array.isArray(fn) ? fn : [fn];
    fn.forEach(function(f) {
      this._pre.push(f);
    }, this);
  }

  post(fn) {
    fn = Array.isArray(fn) ? fn : [fn];
    fn.forEach(function(f) {
      this._post.push(f);
    }, this);
  }

  onceDrain(fn) {
    this.queue.drain = () => {
      this.queue.drain = null;
      fn();
    };
  }

  kill() {
    this.queue.kill();
  }
}

module.exports = EmitterQueue;
