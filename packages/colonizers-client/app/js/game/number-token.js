'use strict';

var Konva = require('konva');

function NumberToken(value) {
  this.onBoardRotate = this.onBoardRotate.bind(this);
  this.render(value);
}

NumberToken.prototype.getDotInfo = function(value) {
  var count = value - 1,
      color,
      offset;

  if (count > 6) {
    count = count * -1 + 12;
  }

  color = count === 5 ? '#a23129' : '#000';
  offset = -2 * (count + 1);

  return {
    count: count,
    color: color,
    offset: offset
  };
};

NumberToken.prototype.render = function(value) {
  var dotInfo = this.getDotInfo(value);

  this.group = new Konva.Group({
    x: 0,
    y: 0,
    rotation: 0
  });

  this.renderCircle();
  this.renderText(dotInfo, value);
  this.renderDots(dotInfo);
};

NumberToken.prototype.renderCircle = function() {
  var circle = new Konva.Circle({
    x: 0,
    y: 0,
    radius: 20,
    fill: '#fff',
    stroke: 'grey',
    strokeWidth: 1
  });
  this.group.add(circle);
};

NumberToken.prototype.renderText = function(dotInfo, value) {
  var text = new Konva.Text({
    text: value.toString(),
    fill: dotInfo.color,
    fontSize: 16,
    align: 'center'
  });
  text.setX(text.getWidth() / 2 * -1);
  text.setY(text.getHeight() / 2 * -1);
  this.group.add(text);
};

NumberToken.prototype.renderDots = function(dotInfo) {
  for (var i = 1; i <= dotInfo.count; i++) {
    this.group.add(new Konva.Circle({
      x: (4 * i) + dotInfo.offset,
      y: 12,
      radius: 1,
      fill: dotInfo.color
    }));
  }
};

NumberToken.prototype.onBoardRotate = function(rotation) {
  this.group.rotation(-rotation);
};

module.exports = NumberToken;
