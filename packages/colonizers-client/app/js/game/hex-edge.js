'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    core = require('colonizers-core'),
    HexEdge = core.HexEdge,
    MathHelper = core.MathHelper;

function UiHexEdge(factory, options) {
  HexEdge.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

core.util.inherits(UiHexEdge, HexEdge);

UiHexEdge.prototype.render = function(options) {
  var rotation = MathHelper.getAngle(options.ends[0], options.ends[1]),
      height = 10,
      width = options.hexInfo.circumradius - 36;

  this.group = new Kinetic.Group({
    x: options.center.x,
    y: options.center.y,
    rotation: rotation
  });

  this.rect = new Kinetic.Rect({
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
      type: 'edge',
      id: this.id
    });
  }.bind(this));

  this.rect.on('tap', function() {
    this.emit('click', {
      type: 'edge',
      id: this.id
    });
  }.bind(this));
};

UiHexEdge.prototype.build = function(player) {
  var colors = this.board.game.getPlayerColors();

  HexEdge.prototype.build.call(this, player);

  this.rect.fill(colors[player.id]);
  this.rect.opacity(1);
  this.rect.show();
  this.rect.draw();
};

UiHexEdge.prototype.show = function(player) {
  if (this.isBuildable) {
    var colors = this.board.game.getPlayerColors();
    this.rect.fill(colors[player.id]);
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