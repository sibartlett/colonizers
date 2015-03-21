'use strict';

var _ = require('underscore'),
    ScenarioBuilder = require('./scenario-builder'),
    scenarioFile = require('../scenarios/default');

function GameBuilder() {
}

GameBuilder.prototype.getGame = function(players, gameOptions) {
  var plys = _.shuffle(players),
      scenarioBuilder = new ScenarioBuilder({
        scenario: scenarioFile,
        numPlayers: players.length,
        gameOptions: gameOptions
      }),
      scenario = scenarioBuilder.getScenario();

  return {
    seed: Date.now(),
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
