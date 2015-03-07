'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Konva = require('konva'),
    core = require('colonizers-core'),
    HexCorner = core.HexCorner;

function UiHexCorner(factory, options) {
  HexCorner.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

core.util.inherits(UiHexCorner, HexCorner);

UiHexCorner.prototype.render = function(options) {
  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y,
    visible: false
  });

  this.drawing = new Konva.Circle({
    x: 0,
    y: 0,
    radius: 8
  });

  this.group.add(this.drawing);
};

UiHexCorner.prototype.hookupEvents = function() {
  this.drawing.on('mouseover', function() {
    $(this.drawing.getStage().container()).addClass('clickable');
  }.bind(this));

  this.drawing.on('mouseout', function() {
    $(this.drawing.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.drawing.on('click', function() {
    if (!this.isSettlement)
    {
      this.emit('click', { type: 'settlement', id: this.id});
    }
    else
    {
      this.emit('click', { type: 'city', id: this.id});
    }
  }.bind(this));

  this.drawing.on('tap', function() {
    if (!this.isSettlement)
    {
      this.emit('click', { type: 'settlement', id: this.id});
    }
    else
    {
      this.emit('click', { type: 'city', id: this.id});
    }
  }.bind(this));
};

UiHexCorner.prototype.buildSettlement = function(player) {
  var colors = this.board.game.getPlayerColors();

  this.drawing = new Konva.Shape({
    fill: colors[player.id],
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-12, -5);
      context.beginPath();
      context.lineTo(-12, 15);
      context.lineTo(12, 15);
      context.lineTo(12, -5);
      context.lineTo(0, -15);
      context.lineTo(-12, -5);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  HexCorner.prototype.buildSettlement.call(this, player);

  this.drawing.fill(colors[player.id]);
  this.drawing.opacity(1);
  this.group.show();
  this.group.draw();

  this.hookupEvents();
};

UiHexCorner.prototype.buildCity = function(player) {
  var colors = this.board.game.getPlayerColors();

  this.drawing = new Konva.Shape({
    fill: colors[player.id],
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-12, -5);
      context.beginPath();
      context.lineTo(-12, 15);
      context.lineTo(28, 15);
      context.lineTo(28, 0);
      context.lineTo(12, 0);
      context.lineTo(12, -5);
      context.lineTo(0, -15);
      context.lineTo(-12, -5);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  HexCorner.prototype.buildCity.call(this, player);

  this.drawing.fill(colors[player.id]);
  this.drawing.opacity(1);
  this.group.show();
  this.group.draw();
};

UiHexCorner.prototype.show = function(player) {
  var colors;
  if (this.isBuildable) {
    colors = this.board.game.getPlayerColors();
    this.drawing.fill(colors[player.id]);
    this.drawing.opacity(0.4);
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
