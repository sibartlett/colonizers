'use strict';

var template = require('./html-templates').tradeModal;
var observableProps = require('./../game/observable-properties');

function ResourceModel(key, player) {
  this.wantUp = this.wantUp.bind(this);
  this.giveUp = this.giveUp.bind(this);

  this.key = key;
  this.player = player;

  observableProps.defineProperties(this, {
    want: 0,
    give: 0,
    resources: this.getResources,
    diff: this.getDiff,
    inventory: this.getInventory
  });
}

ResourceModel.prototype.getResources = function() {
  return this.player.resources[this.key] || 0;
};

ResourceModel.prototype.getDiff = function() {
  return this.want - this.give;
};

ResourceModel.prototype.getInventory = function() {
  return this.resources + this.diff;
};

ResourceModel.prototype.giveUp = function() {
  if (this.want > 0) {
    this.want -= 1;
  } else {
    if (this.inventory > 0) {
      this.give += 1;
    }
  }
};

ResourceModel.prototype.wantUp = function() {
  if (this.give > 0) {
    this.give -= 1;
  } else {
    this.want += 1;
  }
};

function TradeModalModel(roomModel) {
  this.actions = roomModel.actions;
  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    resources: this.getResources
  });

  this.offerTrade = this.offerTrade.bind(this);
}

TradeModalModel.prototype.getResources = function() {
  var resourceKeys = ['lumber', 'brick', 'wool', 'grain', 'ore'];
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer && thisPlayer.resources) {
    return resourceKeys.map(function(key) {
      return new ResourceModel(key, thisPlayer);
    });
  }

  return [];
};

TradeModalModel.prototype.offerTrade = function() {
  var resources = this.resources
    .map(function(resource) {
      return {
        resource: resource.key,
        value: resource.diff
      };
    })
    .filter(function(resource) {
      return resource.value !== 0;
    });

  this.actions.offerTrade(resources);
};

module.exports = {
  viewModel: TradeModalModel,
  template: template
};
