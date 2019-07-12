'use strict';

class Resources {
  constructor(factory) {
    factory.defineProperties(this, {
      total: 0,
      brick: 0,
      grain: 0,
      lumber: 0,
      ore: 0,
      wool: 0
    });
  }
}

class DevelopmentCards {
  constructor(factory) {
    factory.defineProperties(this, {
      total: 0
    });
  }
}

class VictoryPoints {
  constructor(factory) {
    factory.defineProperties(this, {
      public: 0,
      actual: 0
    });
  }
}

class Player {
  constructor(factory, options) {
    factory.defineProperties(this, {
      id: options.id,
      resources: new Resources(factory),
      developmentCards: new DevelopmentCards(factory),
      victoryPoints: new VictoryPoints(factory),
      knightsPlayed: 0,
      longestRoad: 0
    });
  }

  hasResources(resources) {
    var value;

    for (var resource in resources) {
      value = resources[resource];
      if (this.resources[resource] < value) {
        return false;
      }
    }

    return true;
  }

  distribute(resources) {
    var total = 0;
    var value;

    for (var resource in resources) {
      value = resources[resource];
      total += value;
      this.resources[resource] += value;
    }

    this.resources.total += total;
    this.longestRoad = 0;
  }

  spend(resources) {
    var total = 0;
    var value;

    for (var resource in resources) {
      value = resources[resource];
      total -= value;
      this.resources[resource] -= value;
    }

    this.resources.total -= total;
  }

  addVictoryPoint(devCard) {
    if (devCard) {
      this.victoryPoints.public++;
    }

    this.victoryPoints.actual++;
  }
}

module.exports = Player;
