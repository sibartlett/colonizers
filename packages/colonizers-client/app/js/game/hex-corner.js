'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Konva = require('konva'),
    util = require('colonizers-core/lib/util'),
    HexCorner = require('colonizers-core/lib/game-objects/hex-corner');

function UiHexCorner(factory, options) {
  HexCorner.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

util.inherits(UiHexCorner, HexCorner);

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
  HexCorner.prototype.buildSettlement.call(this, player);

  if (this.drawing) {
    this.drawing.destroy();
  }

  this.drawing = new Konva.Shape({
    stroke: 'white',
    strokeWidth: 1,
    fill: player.color,
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-10, -5);
      context.beginPath();
      context.lineTo(-10, 11);
      context.lineTo(10, 11);
      context.lineTo(10, -5);
      context.lineTo(0, -15);
      context.lineTo(-10, -5);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  this.group.show();
  this.group.draw();

  this.hookupEvents();
};

UiHexCorner.prototype.buildCity = function(player) {
  HexCorner.prototype.buildCity.call(this, player);

  if (this.drawing) {
    this.drawing.destroy();
  }

  this.drawing = new Konva.Shape({
    stroke: 'white',
    strokeWidth: 1,
    fill: player.color,
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-19, -9);
      context.beginPath();
      context.lineTo(-19, 17);
      context.lineTo(19, 17);
      context.lineTo(19, -1);
      context.lineTo(1, -1);
      context.lineTo(1, -9);
      context.lineTo(-9, -19);
      context.lineTo(-19, -9);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  this.group.show();
  this.group.draw();
};

UiHexCorner.prototype.show = function(player) {
  if (this.isBuildable) {
    this.drawing.fill(player.color);
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

UiHexCorner.prototype.addToBoard = function(board) {
  HexCorner.prototype.addToBoard.call(this, board);

  board.on('board:rotate', function(rotation) {
    this.group.rotation(-rotation);
  }.bind(this));
};

module.exports = UiHexCorner;
