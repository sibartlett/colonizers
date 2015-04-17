'use strict';

var _ = require('underscore');
var Konva = require('konva');
var util = require('colonizers-core/lib/util');
var HexTile = require('colonizers-core/lib/game-objects/hex-tile');
var NumberToken = require('./number-token');

function UiHexTile(factory, options, tileset) {
  HexTile.apply(this, arguments);
  this.addToBoard = this.addToBoard.bind(this);
  this.render(options, tileset);
}

util.inherits(UiHexTile, HexTile);

UiHexTile.prototype.render = function(options, tileset) {
  var tileStyle = tileset.tiles[options.type];
  var tileSpacing = tileset.board.tilespacing || 8;
  var hexagonOpts = this.getHexOptions(tileStyle, tileSpacing, options.hexInfo);

  this.numberToken = null;

  this.hexagon = new Konva.RegularPolygon(hexagonOpts);
  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y
  });

  this.group.add(this.hexagon);

  if (tileStyle.stroke) {
    this.hexagon2 = new Konva.RegularPolygon({
      x: 0,
      y: 0,
      sides: 6,
      radius: options.hexInfo.circumradius - tileSpacing,
      rotation: 270,
      stroke: tileStyle.stroke,
      strokeWidth: tileStyle.strokeWidth || 1
    });
    this.group.add(this.hexagon2);
  }

  if (tileset.board && tileset.board.bgcolor) {
    this.bgHexagon = new Konva.RegularPolygon({
      x: options.center.x,
      y: options.center.y,
      sides: 6,
      radius: options.hexInfo.circumradius + tileSpacing,
      rotation: 270,
      fill: tileset.board.bgcolor
    });
  }

  this.group.add(this.hexagon2);

  if (options.value > 0) {
    this.addNumberToken(options.value);
  }
};

UiHexTile.prototype.getHexOptions = function(tileStyle, tileSpacing, hexInfo) {
  var options = {
    x: 0,
    y: 0,
    sides: 6,
    radius: hexInfo.circumradius - tileSpacing,
    rotation: 270,
    fill: tileStyle.bgcolor,
    opacity: tileStyle.opacity || 1
  };

  if (tileStyle.bgimage) {
    var patternScale = hexInfo.circumradius * 2 / tileStyle.bgimage.width;
    options = _.extend(options, {
      fillPriority: 'pattern',
      fillPatternImage: tileStyle.bgimage,
      fillPatternScaleX: patternScale,
      fillPatternScaleY: patternScale,
      fillPatternRotation: 90,
      fillPatternY: -hexInfo.circumradius,
      fillPatternX: -hexInfo.apothem
    });
  }

  return options;
};

UiHexTile.prototype.addNumberToken = function(value) {
  this.numberToken = new NumberToken(value);
  this.group.add(this.numberToken.group);
};

UiHexTile.prototype.addToBoard = function(board) {
  HexTile.prototype.addToBoard.call(this, board);
  if (this.numberToken) {
    board.on('board:rotate', this.numberToken.onBoardRotate);
  }
};

module.exports = UiHexTile;
