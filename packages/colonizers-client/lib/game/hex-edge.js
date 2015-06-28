'use strict';

var $ = require('jquery');
var emitter = require('component-emitter');
var Konva = require('konva');
var MathHelper = require('colonizers-core/lib/math-helper');
var HexEdge = require('colonizers-core/lib/game-objects/hex-edge');

class UiHexEdge extends HexEdge {
  constructor(factory, options) {
    super(factory, options);
    emitter(this);
    this.render(options);
    this.hookupEvents();
  }

  render(options) {
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
  }

  hookupEvents() {
    this.rect.on('mouseover', () => {
      return $(this.rect.getStage().container()).addClass('clickable');
    });

    this.rect.on('mouseout', () => {
      return $(this.rect.getStage().container()).removeClass('clickable');
    });

    this.rect.on('click', () => {
      this.emit('click', {
        type: 'road',
        id: this.id
      });
    });

    this.rect.on('tap', () => {
      this.emit('click', {
        type: 'road',
        id: this.id
      });
    });
  }

  build(player) {
    super.build(player);

    this.rect.fill(player.color);
    this.rect.height(6);
    this.rect.y(-6 / 2);
    this.rect.opacity(1);
    this.rect.show();
    this.rect.draw();
  }

  show(player) {
    if (this.isBuildable) {
      this.rect.fill(player.color);
      this.rect.opacity(0.4);
      this.rect.show();
      this.rect.draw();
    }
  }

  hide() {
    this.rect.opacity(0);
    this.rect.hide();
    this.rect.draw();
  }
}

module.exports = UiHexEdge;
