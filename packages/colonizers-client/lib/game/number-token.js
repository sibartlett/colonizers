'use strict';

var Konva = require('konva');

class NumberToken {
  constructor(value) {
    this.onBoardRotate = this.onBoardRotate.bind(this);
    this.render(value);
  }

  getDotInfo(value) {
    var count = value - 1;

    if (count > 6) {
      count = count * -1 + 12;
    }

    var color = count === 5 ? '#a23129' : '#000';
    var offset = -2 * (count + 1);

    return {
      count: count,
      color: color,
      offset: offset
    };
  }

  render(value) {
    var dotInfo = this.getDotInfo(value);

    this.group = new Konva.Group({
      x: 0,
      y: 0,
      rotation: 0
    });

    this.renderCircle();
    this.renderText(dotInfo, value);
    this.renderDots(dotInfo);
  }

  renderCircle() {
    var circle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 20,
      fill: '#fff',
      stroke: 'grey',
      strokeWidth: 1
    });
    this.group.add(circle);
  }

  renderText(dotInfo, value) {
    var text = new Konva.Text({
      text: value.toString(),
      fill: dotInfo.color,
      fontSize: 16,
      align: 'center'
    });
    text.setX(text.getWidth() / 2 * -1);
    text.setY(text.getHeight() / 2 * -1);
    this.group.add(text);
  }

  renderDots(dotInfo) {
    for (var i = 1; i <= dotInfo.count; i++) {
      this.group.add(new Konva.Circle({
        x: (4 * i) + dotInfo.offset,
        y: 12,
        radius: 1,
        fill: dotInfo.color
      }));
    }
  }

  onBoardRotate(rotation) {
    this.group.rotation(-rotation);
  }
}

module.exports = NumberToken;
