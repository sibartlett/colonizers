'use strict';

var emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    Board = common.Board;

function UiBoard() {
  this.onStageTransformEnd = this.onStageTransformEnd.bind(this);
  this.onStageTransform = this.onStageTransform.bind(this);
  this.addEdge = this.addEdge.bind(this);
  this.addCorner = this.addCorner.bind(this);
  this.addTile = this.addTile.bind(this);
  this.redraw = this.redraw.bind(this);

  Board.apply(this, arguments);
  emitter(this);

  this.bgGroup = new Kinetic.Group();
  this.fgGroup = new Kinetic.Group();
  this.layer = new Kinetic.Layer({
    rotation: 0,
    draggable: true
  });

  this.layer.add(this.bgGroup);
  this.layer.add(this.fgGroup);
}

common.util.inherits(UiBoard, Board);

UiBoard.prototype.redraw = function() {
  this.layer.batchDraw();
};

UiBoard.prototype.addTile = function(tile) {
  Board.prototype.addTile.call(this, tile);

  if (tile.bgHexagon) {
    this.bgGroup.add(tile.bgHexagon);
  }

  this.fgGroup.add(tile.group);
};

UiBoard.prototype.addCorner = function(corner) {
  Board.prototype.addCorner.call(this, corner);
  this.layer.add(corner.group);
};

UiBoard.prototype.addEdge = function(edge) {
  Board.prototype.addEdge.call(this, edge);
  this.layer.add(edge.group);
};

UiBoard.prototype.onStageTransform = function(transform) {
  var offset;

  if (this.transforming) {
    return;
  }
  this.transforming = true;
  if (transform.center && !this.transformOffset) {
    this.transformOffset = true;
    this.layer.draggable(false);
    offset = this.layer.getAbsoluteTransform().invert().point(transform.center);
    this.layer.position(transform.center);
    this.layer.offset(offset);
  }
  if (transform.center) {
    this.layer.position(transform.center);
  }
  this.layer.scale({
    x: transform.scale,
    y: transform.scale
  });
  this.layer.rotation(transform.rotation);
  this.emit('board:rotate', transform.rotation);
  this.redraw();
  this.transforming = false;
};

UiBoard.prototype.onStageTransformEnd = function() {
  this.transformOffset = false;
  this.layer.draggable(true);
};

module.exports = UiBoard;
