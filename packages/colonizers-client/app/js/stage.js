'use strict';

var StageNavigator = require('./stage-navigator'),
    $ = require('jquery'),
    Konva = require('konva');

function Stage(container) {
  this.onResize = this.onResize.bind(this);
  this.draw = this.draw.bind(this);

  this.container = container;
  this.game = null;
  this.board = null;
  this.minScale = 1;
  this.height = $(this.container).height();
  this.width = $(this.container).width();
  this.stage = new Konva.Stage({
    container: this.container,
    width: this.width,
    height: this.height
  });
  this.waitingLayer = this.getWaitingLayer();
  this.stage.add(this.waitingLayer);
  this.navigator = new StageNavigator(this.stage);
  $(window).on('resize', this.onResize);
}

Stage.prototype.getWaitingLayer = function() {
  var layer = new Konva.Layer({
        x: this.width / 2,
        y: this.height / 2
      }),
      text = new Konva.Text({
        width: this.width - 40,
        align: 'center',
        text: 'Waiting for more players...',
        fill: '#666',
        opacity: 0.8,
        fontSize: 48
      });

  text.position({
    x: text.getWidth() / -2,
    y: text.getHeight() / -2
  });

  layer.add(text);

  return layer;
};

Stage.prototype.draw = function() {
  this.stage.batchDraw();
};

Stage.prototype.addGame = function(game) {
  this.game = game;
  this.game.on('draw', this.draw);
  this._addBoard(this.game.board);
};

Stage.prototype._addBoard = function(board) {
  this.board = board;
  this.board.layer.x(this.width / 2);
  this.board.layer.y(this.height / 2);
  this.waitingLayer.remove();
  this.stage.add(this.board.layer);
  this.navigator.addBoard(this.board);
};

Stage.prototype.removeGame = function() {
  if (this.game) {
    this.game.off('draw', this.draw);
    this._removeBoard(this.game.board);
    this.game = null;
  }
};

Stage.prototype._removeBoard = function() {
  this.navigator.removeBoard(this.board);
  this.board.layer.remove();
  this.stage.add(this.waitingLayer);
  this.board = null;
};

Stage.prototype.onResize = function() {
  this.height = $(this.container).height();
  this.width = $(this.container).width();
  this.stage.height(this.height);
  this.stage.width(this.width);
  this.stage.batchDraw();
  this.navigator.stageResized(this.board);
};

module.exports = Stage;
