'use strict';

var emitter = require('component-emitter');
var Konva = require('konva');
var Board = require('colonizers-core/lib/game-objects/board');

class UiBoard extends Board {
  constructor(factory, options) {
    super(factory, options);
    emitter(this);

    this.onStageTransformEnd = this.onStageTransformEnd.bind(this);
    this.onStageTransform = this.onStageTransform.bind(this);
    this.addEdge = this.addEdge.bind(this);
    this.addCorner = this.addCorner.bind(this);
    this.addTile = this.addTile.bind(this);
    this.redraw = this.redraw.bind(this);

    this.bgGroup = new Konva.Group();
    this.fgGroup = new Konva.Group();
    this.layer = new Konva.Layer({
      rotation: 0,
      draggable: true
    });

    this.layer.add(this.bgGroup);
    this.layer.add(this.fgGroup);
  }

  redraw() {
    this.layer.batchDraw();
  }

  addTile(tile) {
    super.addTile(tile);

    if (tile.bgHexagon) {
      this.bgGroup.add(tile.bgHexagon);
    }

    this.fgGroup.add(tile.group);
  }

  addCorner(corner) {
    super.addCorner(corner);
    this.layer.add(corner.group);
  }

  addEdge(edge) {
    super.addEdge(edge);
    this.layer.add(edge.group);
  }

  onStageTransform(transform) {
    var offset;

    if (this.transforming) {
      return;
    }

    this.transforming = true;
    if (transform.center && !this.transformOffset) {
      this.transformOffset = true;
      this.layer.draggable(false);
      offset = this.layer
        .getAbsoluteTransform()
        .invert()
        .point(transform.center);
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
  }

  onStageTransformEnd() {
    this.transformOffset = false;
    this.layer.draggable(true);
  }
}

module.exports = UiBoard;
