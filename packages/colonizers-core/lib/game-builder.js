'use strict';

var Chance = require('chance'),
    ScenarioBuilder = require('./scenario-builder'),
    scenarioFile = require('../scenarios/default');

function GameBuilder() {
  this.chance = new Chance();
}

GameBuilder.prototype.getGame = function(players, gameOptions) {
  var plys = this.chance.shuffle(players),
      scenarioBuilder = new ScenarioBuilder({
        scenario: scenarioFile,
        numPlayers: players.length,
        gameOptions: gameOptions
      }),
      scenario = scenarioBuilder.getScenario();

  return {
    allowance: scenario.allowance,
    board: scenario.board,
    players: plys.map(function(player) {
      return {
        id: player.id
      };
    })
  };
};

module.exports = GameBuilder;
