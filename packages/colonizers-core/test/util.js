'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('util', function() {

  var util = require('../lib/util');

  describe('inherits()', function() {

    it('assigns prototype properties', function(done) {

      function Base() {

      }

      Base.prototype.method = function() {

      };

      Base.prototype.prop = 1;

      function Child() {

      }

      util.inherits(Child, Base);

      var child = new Child();
      expect(child).to.be.empty();
      expect(child.method).to.be.a.function().and.to.equal(Base.prototype.method);
      expect(child.prop).to.be.a.number().and.to.equal(1);

      done();

    });

  });

});
