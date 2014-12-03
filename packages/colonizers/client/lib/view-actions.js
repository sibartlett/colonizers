'use strict';

function ViewActions(socket) {
  this.socket = socket;

  this.endTurn = this.endTurn.bind(this);
  this.offerTrade = this.offerTrade.bind(this);
}

ViewActions.prototype.endTurn = function() {
  this.socket.emit('EndTurn');
};

ViewActions.prototype.offerTrade = function(resources) {
  this.socket.emit('OfferTrade', {
    resources: resources
  });
};

module.exports = ViewActions;
