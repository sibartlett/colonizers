'use strict';

var $ = require('jquery');
var emitter = require('component-emitter');
var Konva = require('konva');
var HexCorner = require('colonizers-core/lib/game-objects/hex-corner');

class UiHexCorner extends HexCorner {
  constructor(factory, options) {
    super(factory, options);
    emitter(this);
    this.render(options);
    this.hookupEvents();
  }

  render(options) {
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
  }

  hookupEvents() {
    this.drawing.on('mouseover', () => {
      $(this.drawing.getStage().container()).addClass('clickable');
    });

    this.drawing.on('mouseout', () => {
      $(this.drawing.getStage().container()).removeClass('clickable');
    });

    var build = () => {
      var data = { id: this.id };
      data.type = !this.isSettlement ? 'settlement' : 'city';
      this.emit('click', data);
    };

    this.drawing.on('click', build);
    this.drawing.on('tap', build);
  }

  buildSettlement(player) {
    super.buildSettlement(player);

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
      sceneFunc: function(context) {
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
  }

  buildCity(player) {
    super.buildCity(player);

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
      sceneFunc: function(context) {
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
  }

  show(player) {
    if (this.isBuildable) {
      this.drawing.fill(player.color);
      this.drawing.opacity(0.4);
      this.group.show();
      this.group.draw();
    }
  }

  hide() {
    if (this.isBuildable) {
      this.group.hide();
      this.group.draw();
    }
  }

  addToBoard(board) {
    super.addToBoard(board);
    board.on('board:rotate', rotation => {
      this.group.rotation(-rotation);
    });
  }
}

module.exports = UiHexCorner;
