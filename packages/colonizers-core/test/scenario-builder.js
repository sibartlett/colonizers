'use strict';

var Code = require('code');
var Lab = require('lab');
var validator = require('is-my-json-valid');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('ScenarioBuilder', function() {

  var ScenarioBuilder = require('../lib/scenario-builder');
  var validateGame = validator(require('../schemas/game.json'));

  var baseScenario = require('../scenarios/default');

  var simpleScenario1 = {
    allowance: {
      roads: 3,
      settlements: 1,
      cities: 1
    },
    layouts: [
      {
        players: {
          min: 3,
          max: 4
        },
        numberTokens: [5, 2, 6],
        terrainTiles: 'o,g,l',
        tiles: [
          '-,t1',
          ',t3,t2'
        ]
      }
    ]
  };

  var simpleScenario2 = {
    allowance: {
      roads: 15,
      settlements: 5,
      cities: 4
    },
    layouts: [
      {
        players: {
          min: 3,
          max: 4
        },
        numberTokens: [5, 2, 6, 3, 8],
        terrainTiles: 'o,g,l',
        tiles: [
          ',t1,t3',
          ',t2'
        ]
      }
    ]
  };


  describe('getScenario()', function() {

    it('returns valid scenario for 3 players, non-random', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: baseScenario,
        numPlayers: 3,
        gameOptions: {
          shuffleTerrainTiles: false,
          shuffleNumberTokens: false
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

    it('returns valid scenario for 3 players, random tiles', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: baseScenario,
        numPlayers: 3,
        gameOptions: {
          shuffleTerrainTiles: true,
          shuffleNumberTokens: false
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

    it('returns valid scenario for 3 players, random tokens', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: baseScenario,
        numPlayers: 3,
        gameOptions: {
          shuffleTerrainTiles: false,
          shuffleNumberTokens: true
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

    it('returns valid scenario for 4 players, random board', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: baseScenario,
        numPlayers: 4,
        gameOptions: {
          shuffleTerrainTiles: true,
          shuffleNumberTokens: true
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

    it('returns valid scenario, with even first row', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: simpleScenario1,
        numPlayers: 4,
        gameOptions: {
          shuffleTerrainTiles: true,
          shuffleNumberTokens: true
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

    it('returns valid scenario, with even odd row', function(done) {
      var scenarioBuilder = new ScenarioBuilder({
        scenario: simpleScenario2,
        numPlayers: 4,
        gameOptions: {
          shuffleTerrainTiles: true,
          shuffleNumberTokens: true
        }
      });

      var game = scenarioBuilder.getScenario();
      var validGame = validateGame(game);

      expect(validGame).to.be.true();
      done();
    });

  });

});
