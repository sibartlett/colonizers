'use strict';

var $ = require('jquery');
var emitter = require('component-emitter');
var Hammer = require('hammerjs');
var mousewheel = require('jquery-mousewheel');

if (typeof mousewheel == 'function') {
  mousewheel($);
}

function TwoFingerRecognizer() {
  Hammer.AttrRecognizer.apply(this, arguments);
}

Hammer.inherit(TwoFingerRecognizer, Hammer.AttrRecognizer, {
  defaults: {
    event: 'twofinger',
    pointers: 2
  },

  getTouchAction: function() {
    return [Hammer.TOUCH_ACTION_NONE];
  },

  attrTest: function(input) {
    return this._super.attrTest.call(this, input);
  }
});

function StageNavigator(stage) {
  var container = stage.container();
  var targetFps = 60;

  emitter(this);

  this.stage = stage;
  this.reset();

  this.hammerManager = new Hammer.Manager(container);
  this.hammerManager.add(new TwoFingerRecognizer());
  this.hammerManager.on('twofinger', this.onHammerTransform.bind(this));
  this.hammerManager.on('twofingerend', this.onHammerTransformEnd.bind(this));

  $(container).on('mousewheel', this.onMousewheel.bind(this));

  if (window.wiiu && window.wiiu.gamepad) {
    setInterval(this.onWiiuInput.bind(this), 1000 / targetFps);
  }
}

StageNavigator.prototype.reset = function() {
  this.transformOrigin = null;
  this.minScale = 1;
  this.transform = {
    rotation: 0,
    scale: 1
  };
};

StageNavigator.prototype.stageResized = function(board) {
  if (board) {
    var minCanvas = Math.min(this.stage.height, this.stage.width);
    var maxDimension = Math.max(board.height, board.width);
    this.minScale = minCanvas / maxDimension;
  } else {
    this.minScale = 1;
  }
};

StageNavigator.prototype.addBoard = function(board) {
  this.stageResized(board);
  this.on('stage:transform', board.onStageTransform);
  this.on('stage:transformend', board.onStageTransformEnd);
};

StageNavigator.prototype.removeBoard = function(board) {
  this.off('stage:transform', board.onStageTransform);
  this.off('stage:transformend', board.onStageTransformEnd);
  this.reset();
};

StageNavigator.prototype.setTransform = function(rotation, scale, center) {
  scale = scale < this.minScale ? this.minScale : scale;
  scale = scale > 2 ? 2 : scale;
  this.transform.rotation = rotation;
  this.transform.scale = scale;
  this.emit('stage:transform', {
    rotation: this.transform.rotation,
    scale: this.transform.scale,
    center: center
  });
};

StageNavigator.prototype.onMousewheel = function(event) {
  event.preventDefault();

  if (event.ctrlKey) {
    var rotation = this.transform.rotation + event.deltaY * 0.02;
    this.setTransform(rotation, this.transform.scale);
  } else {
    var scale = this.transform.scale + event.deltaY * 0.0012;
    this.setTransform(this.transform.rotation, scale);
  }
};

StageNavigator.prototype.onHammerTransform = function(event) {
  if (this.transformOrigin == null) {
    this.stage.draggable(false);
    this.transformOrigin = {
      rotation: this.transform.rotation,
      scale: this.transform.scale
    };
  }

  var rotation = this.transformOrigin.rotation + event.rotation;
  var scale = this.transformOrigin.scale * event.scale;
  this.setTransform(rotation, scale, event.center);
};

StageNavigator.prototype.onHammerTransformEnd = function() {
  this.transformOrigin = null;
  this.emit('stage:transformend');
};

StageNavigator.prototype.onWiiuInput = function() {
  var state = window.wiiu.gamepad.update();
  var dragX = 0;
  var dragY = 0;
  var rotate = 0;
  var zoom = 0;
  var buttonMap = {
    lStickUp: 0x10000000,
    lStickDown: 0x08000000,
    lStickLeft: 0x40000000,
    lStickRight: 0x20000000,
    rStickUp: 0x01000000,
    rStickDown: 0x00800000,
    rStickLeft: 0x04000000,
    rStickRight: 0x02000000,
    lStickButton: 0x00040000,
    rStickButton: 0x00020000
  };

  if (!state.isEnabled && !state.isDataValid) {
    return;
  }

  if (state.hold & 0x7f86fffc & buttonMap.lStickUp) {
    dragX++;
  }

  if (state.hold & 0x7f86fffc & buttonMap.lStickDown) {
    dragX--;
  }

  if (state.hold & 0x7f86fffc & buttonMap.lStickLeft) {
    dragY++;
  }

  if (state.hold & 0x7f86fffc & buttonMap.lStickRight) {
    dragY--;
  }

  if (state.hold & 0x7f86fffc & buttonMap.rStickLeft) {
    rotate--;
  }

  if (state.hold & 0x7f86fffc & buttonMap.rStickRight) {
    rotate++;
  }

  if (state.hold & 0x7f86fffc & buttonMap.rStickUp) {
    zoom++;
  }

  if (state.hold & 0x7f86fffc & buttonMap.rStickDown) {
    zoom--;
  }

  var rotation = this.transform.rotation + rotate * 20;
  var scale = this.transform.scale + (10 + zoom) * 0.1;
  this.setTransform(rotation, scale);
};

module.exports = StageNavigator;
