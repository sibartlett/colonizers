'use strict';

var _ = require('underscore');
var ScenarioBuilder = require('./scenario-builder');
var scenarioFile = require('../scenarios/default');

function GameBuilder() {
}

GameBuilder.prototype.getGame = function(players, gameOptions) {
  var plys = _.shuffle(players);
  var scenarioBuilder = new ScenarioBuilder({
    scenario: scenarioFile,
    numPlayers: players.length,
    gameOptions: gameOptions
  });
  var scenario = scenarioBuilder.getScenario();

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
