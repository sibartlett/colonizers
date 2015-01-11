'use strict';

var ko = require('knockout'),
    images = require('./d6-images');

function DieModel() {
  this.showImg = this.showImg.bind(this);

  this.imageSrc = ko.observable('');

  this.seedMod = Math.round(Math.random() * 100);
  this.seedModInc = Math.round(Math.random() * 100) + 89;
  this.initSeed();
  this.callback = function() {
    return false;
  };
  this.interval = 50;
}

DieModel.prototype.start = function(result, callback) {
  var sequence = [],
      seqCount = this.random(6) + this.random(6) + this.random(6) + 4,
      thisRoll = 0,
      i;

  this.callback = callback;

  for (i = 0; i <= seqCount; i++) {
    thisRoll += this.randomBaseOne(5);
    thisRoll = thisRoll % 6;
    if (!thisRoll) {
      thisRoll = 6;
    }
    sequence.push(thisRoll);
  }

  sequence.push(result);
  this.result = result;
  this.animate(sequence);
};

DieModel.prototype.animate = function(sequence) {
  var numNumbers = sequence.length,
      state = 'die',
      seq,
      nextCall;

  if (numNumbers % 2 === 0) {
    state = this.random(2) === 0 ? 'side' : 'top';
  }
  this.showImg(sequence[0], state);
  if (state === 'die') {
    if (numNumbers === 1) {
      setTimeout(this.callback, this.interval);
      return true;
    }
  }
  if (sequence.length > 1) {
    seq = sequence.slice(1);
    nextCall = function() {
      return this.animate(seq);
    }.bind(this);
    setTimeout(nextCall, this.interval);
  }
};

DieModel.prototype.showImg = function(number, state) {
  if (number < 1 || number > 6 || !state) {
    this.imageSrc(images.blank);
    return;
  }

  var whichDie = 'die' + number,
      dieObj = images[whichDie],
      dieImg = dieObj[state];

  this.imageSrc(dieImg);
};

DieModel.prototype.clear = function() {
  this.showImg(0, false);
  return this;
};

DieModel.prototype.randomBaseOne = function(n) {
  var m = this.random(n);
  return m + 1;
};

DieModel.prototype.random = function(n) {
  if (!this.seed) {
    this.reInitSeed();
  }
  this.seed = (0x015a4e35 * this.seed) % 0x7fffffff;
  return (this.seed >> 16) % n;
};

DieModel.prototype.initSeed = function() {
  var now = new Date();
  this.seed = (this.seedMod + now.getTime()) % 0xffffffff;
};

DieModel.prototype.reInitSeed = function() {
  this.seedMod += this.seedModInc;
  this.initSeed();
};

module.exports = DieModel;
