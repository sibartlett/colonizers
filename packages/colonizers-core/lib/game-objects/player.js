'use strict';

function Resources(factory) {
  factory.defineProperties(this, {
    total: 0,
    brick: 0,
    grain: 0,
    lumber: 0,
    ore: 0,
    wool: 0
  });
}

function DevelopmentCards(factory) {
  factory.defineProperties(this, {
    total: 0
  });
}

function VictoryPoints(factory) {
  factory.defineProperties(this, {
    public: 0,
    actual: 0
  });
}

function Player(factory, options) {
  factory.defineProperties(this, {
    id: options.id,
    resources: new Resources(factory),
    developmentCards: new DevelopmentCards(factory),
    victoryPoints: new VictoryPoints(factory),
    knightsPlayed: 0,
    longestRoad: 0
  });
}

Player.prototype.hasResources = function(resources) {
  var value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    if (this.resources[resource] < value) {
      return false;
    }
  }

  return true;
};

Player.prototype.distribute = function(resources) {
  var total = 0,
      value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    total += value;
    this.resources[resource] += value;
  }

  this.resources.total += total;
  this.longestRoad = 0;
};

Player.prototype.spend = function(resources) {
  var total = 0,
      value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    total -= value;
    this.resources[resource] -= value;
  }

  this.resources.total -= total;
};

Player.prototype.addVictoryPoint = function(devCard) {
  if (devCard) {
    this.victoryPoints.public++;
  }
  this.victoryPoints.actual++;
};

module.exports = Player;
