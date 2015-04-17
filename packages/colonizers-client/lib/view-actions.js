'use strict';

function ViewActions(emit) {
  this.emit = emit;

  this.endTurn = this.endTurn.bind(this);
  this.offerTrade = this.offerTrade.bind(this);
}

ViewActions.prototype.endTurn = function() {
  this.emit('end-turn');
};

ViewActions.prototype.offerTrade = function(resources) {
  this.emit('trade-offer', {
    resources: resources
  });
};

module.exports = ViewActions;
