'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('EmitterQueue', function() {

  var EventEmitter = require('events').EventEmitter;
  var EmitterQueue = require('../lib/emitter-queue');

  describe('.on(event, fn)', function() {

    it('should add listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.on('foo', function(val, next) {
        calls.push('one', val);
        next();
      });

      emitter.on('foo', function(val, next) {
        calls.push('two', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.pre(fn)', function() {

    it('should add pre listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.pre(function(event, val, next) {
        calls.push(event, val);
        next();
      });

      emitter.on('foo', function(val, next) {
        calls.push('bar', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'foo', 1, 'bar', 1, 'foo', 2, 'bar', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.pre([fn, fn])', function() {

    it('should add pre listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.pre([
        function(event, val, next) {
          calls.push(event);
          next();
        },
        function(event, val, next) {
          calls.push(val);
          next();
        }
      ]);

      emitter.on('foo', function(val, next) {
        calls.push('bar', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'foo', 1, 'bar', 1, 'foo', 2, 'bar', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.post(fn)', function() {

    it('should add post listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.post(function(event, val, next) {
        calls.push(event, val);
        next();
      });

      emitter.on('foo', function(val, next) {
        calls.push('bar', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'bar', 1, 'foo', 1, 'bar', 2, 'foo', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.post([fn,fn])', function() {

    it('should add post listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.post([function(event, val, next) {
        calls.push(event);
        next();
      },
      function(event, val, next) {
        calls.push(val);
        next();
      }]);

      emitter.on('foo', function(val, next) {
        calls.push('bar', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'bar', 1, 'foo', 1, 'bar', 2, 'foo', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.post(fn)', function() {

    it('should add post listeners', function(done) {
      var emitter = new EmitterQueue();
      var calls = [];

      emitter.post(function(event, val, next) {
        calls.push(event, val);
        next();
      });

      emitter.on('foo', function(val, next) {
        calls.push('bar', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'bar', 1, 'foo', 1, 'bar', 2, 'foo', 2 ]);
        done();
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);
    });

  });

  describe('.kill()', function() {

    it('should kill queued events', function(done) {
      var emitter = new EmitterQueue();

      emitter.on('foo', function(val, next) {
        expect(true).to.not.be.true();
        done();
        next();
      });

      emitter.on('bar', function(val, next) {
        done();
        next();
      });

      emitter.emit('foo');
      emitter.kill();
      emitter.emit('bar');
    });

  });

  describe('new EmitterQueue(source)', function() {

    it('should emit events from source', function(done) {
      var source = new EventEmitter();
      var emitter = new EmitterQueue(source);
      var calls = [];

      emitter.on('foo', function(val, next) {
        calls.push('one', val);
        next();
      });

      emitter.on('foo', function(val, next) {
        calls.push('two', val);
        next();
      });

      emitter.onceDrain(function() {
        expect(calls).to.deep.equal([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
        done();
      });

      source.emit('foo', 1);
      source.emit('bar', 1);
      source.emit('foo', 2);
    });

  });

});
