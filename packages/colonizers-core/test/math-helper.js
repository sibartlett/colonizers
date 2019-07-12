'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('MathHelper', function() {

  var MathHelper = require('../lib/math-helper');

  describe('getAngle()', function() {

    it('returns correct angle', function(done) {
      var angle = MathHelper.getAngle({ x: 0, y: 0 }, { x: 10, y: 0 });
      expect(angle).to.be.a.number().and.to.equal(0);

      angle = MathHelper.getAngle({ x: 0, y: 0 }, { x: 10, y: 10 });
      expect(angle).to.be.a.number().and.to.equal(45);

      angle = MathHelper.getAngle({ x: 0, y: 0 }, { x: 0, y: 10 });
      expect(angle).to.be.a.number().and.to.equal(90);

      angle = MathHelper.getAngle({ x: 0, y: 0 }, { x: -10, y: -10 });
      expect(angle).to.be.a.number().and.to.equal(-135);

      done();
    });

  });

  describe('getDisance()', function() {

    it('returns correct distance', function(done) {
      var distance = MathHelper.getDistance({ x: 0, y: 0 }, { x: -10, y: -10 });

      expect(distance).to.be.a.number().and.to.be.in.range(14.142, 14.143);
      done();
    });

  });

  describe('getEndpoint()', function() {

    it('returns correct endpoint', function(done) {
      var endpoint = MathHelper.getEndpoint({ x: 0, y: 0 }, 0, 10);
      expect(endpoint).to.deep.equal({ x: 0, y: 10});

      endpoint = MathHelper.getEndpoint({ x: 0, y: 0 }, 90, 10);
      expect(endpoint).to.deep.equal({ x: 10, y: 0});

      done();
    });

  });

});
