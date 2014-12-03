'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    HexCorner = common.HexCorner;

function UiHexCorner(factory, options) {
  HexCorner.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

common.util.inherits(UiHexCorner, HexCorner);

UiHexCorner.prototype.render = function(options) {
  this.group = new Kinetic.Group({
    x: options.center.x,
    y: options.center.y,
    visible: false
  });

  this.circle = new Kinetic.Circle({
    x: 0,
    y: 0,
    radius: 8
  });

  this.group.add(this.circle);
};

UiHexCorner.prototype.hookupEvents = function() {
  this.circle.on('mouseover', function() {
    $(this.circle.getStage().container()).addClass('clickable');
  }.bind(this));

  this.circle.on('mouseout', function() {
    $(this.circle.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.circle.on('click', function() {
    this.emit('click', {
      type: 'corner',
      id: this.id
    });
  }.bind(this));

  this.circle.on('tap', function() {
    this.emit('click', {
      type: 'corner',
      id: this.id
    });
  }.bind(this));
};

UiHexCorner.prototype.build = function(player) {
  var colors = this.board.game.getPlayerColors();

  HexCorner.prototype.build.call(this, player);

  this.circle.fill(colors[player.id]);
  this.circle.opacity(1);
  this.group.show();
  this.group.draw();
};

UiHexCorner.prototype.show = function(player) {
  var colors;
  if (this.isBuildable) {
    colors = this.board.game.getPlayerColors();
    this.circle.fill(colors[player.id]);
    this.circle.opacity(0.4);
    this.group.show();
    this.group.draw();
  }
};

UiHexCorner.prototype.hide = function() {
  if (this.isBuildable) {
    this.group.hide();
    this.group.draw();
  }
};

module.exports = UiHexCorner;
