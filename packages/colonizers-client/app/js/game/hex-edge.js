'use strict';

var $ = require('jquery');
var emitter = require('component-emitter');
var Konva = require('konva');
var util = require('colonizers-core/lib/util');
var MathHelper = require('colonizers-core/lib/math-helper');
var HexEdge = require('colonizers-core/lib/game-objects/hex-edge');

function UiHexEdge(factory, options) {
  HexEdge.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

util.inherits(UiHexEdge, HexEdge);

UiHexEdge.prototype.render = function(options) {
  var rotation = MathHelper.getAngle(options.ends[0], options.ends[1]);
  var height = 10;
  var width = options.hexInfo.circumradius - 36;

  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y,
    rotation: rotation
  });

  this.rect = new Konva.Rect({
    x: -width / 2,
    y: -height / 2,
    width: width,
    height: height,
    visible: false
  });

  this.group.add(this.rect);
};

UiHexEdge.prototype.hookupEvents = function() {
  this.rect.on('mouseover', function() {
    return $(this.rect.getStage().container()).addClass('clickable');
  }.bind(this));

  this.rect.on('mouseout', function() {
    return $(this.rect.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.rect.on('click', function() {
    this.emit('click', {
      type: 'road',
      id: this.id
    });
  }.bind(this));

  this.rect.on('tap', function() {
    this.emit('click', {
      type: 'road',
      id: this.id
    });
  }.bind(this));
};

UiHexEdge.prototype.build = function(player) {
  HexEdge.prototype.build.call(this, player);

  this.rect.fill(player.color);
  this.rect.height(6);
  this.rect.y(-6 / 2);
  this.rect.opacity(1);
  this.rect.show();
  this.rect.draw();
};

UiHexEdge.prototype.show = function(player) {
  if (this.isBuildable) {
    this.rect.fill(player.color);
    this.rect.opacity(0.4);
    this.rect.show();
    this.rect.draw();
  }
};

UiHexEdge.prototype.hide = function() {
  this.rect.opacity(0);
  this.rect.hide();
  this.rect.draw();
};

module.exports = UiHexEdge;
