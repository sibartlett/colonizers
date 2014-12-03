'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Hammer = require('hammerjs');

require('jquery-mousewheel')($);

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

  var container = stage.container(),
      targetFps = 60;

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
  var minCanvas, maxDimension;

  if (board) {
    minCanvas = Math.min(this.stage.height, this.stage.width);
    maxDimension = Math.max(board.height, board.width);
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
  var rotation, scale;

  event.preventDefault();

  if (event.ctrlKey) {
    rotation = this.transform.rotation + event.deltaY * 0.02;
    this.setTransform(rotation, this.transform.scale);
  } else {
    scale = this.transform.scale + event.deltaY * 0.0012;
    this.setTransform(this.transform.rotation, scale);
  }
};

StageNavigator.prototype.onHammerTransform = function(event) {
  var rotation, scale;

  if (this.transformOrigin == null) {
    this.stage.draggable(false);
    this.transformOrigin = {
      rotation: this.transform.rotation,
      scale: this.transform.scale
    };
  }

  rotation = this.transformOrigin.rotation + event.rotation;
  scale = this.transformOrigin.scale * event.scale;
  this.setTransform(rotation, scale, event.center);
};

StageNavigator.prototype.onHammerTransformEnd = function() {
  this.transformOrigin = null;
  this.emit('stage:transformend');
};

StageNavigator.prototype.onWiiuInput = function() {
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
      },
      state = window.wiiu.gamepad.update(),
      dragX = 0,
      dragY = 0,
      rotate = 0,
      zoom = 0,
      rotation,
      scale;

  if (state.isEnabled && state.isDataValid) {
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
    rotation = this.transform.rotation + rotate * 20;
    scale = this.transform.scale + (10 + zoom) * 0.1;
    this.setTransform(rotation, scale);
  }
};

module.exports = StageNavigator;
