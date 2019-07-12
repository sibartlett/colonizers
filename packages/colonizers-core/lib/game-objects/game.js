'use strict';

var _ = require('underscore');

class Game {
  constructor(factory, options) {
    factory.defineProperties(this, {
      seed: options.seed,
      rolls: options.rolls,
      board: options.board,
      players: options.players,
      allowance: options.allowance,
      currentTrade: options.currentTrade || null,
      turn: null,
      phase: null,
      currentPlayer: null
    });

    this.board.game = this;
    this.setTurn(options.turn || 0);
  }

  offerTrade(options) {
    this.currentTrade = {
      owner: options.playerId,
      resources: options.resources
    };
  }

  setTurn(turn) {
    var data = this.getDataForTurn(turn);
    this.turn = data.turn;
    this.phase = data.phase;
    this.currentPlayer = this.players[data.playerIndex] || null;
  }

  getPlayerById(id) {
    return _.find(this.players, function(player) {
      return player.id === id;
    });
  }

  getDataForTurn(turn) {
    var phase = 'waiting';
    var playerIndex = null;
    var prevTurn;

    if (turn > 0) {
      prevTurn = turn - 1;
      if (turn <= this.players.length * 2) {
        phase = 'setup';
        if (turn <= this.players.length) {
          playerIndex = prevTurn % this.players.length;
        } else {
          playerIndex =
            this.players.length - 1 - (prevTurn % this.players.length);
        }
      } else {
        phase = 'playing';
        playerIndex = prevTurn % this.players.length;
      }
    }

    return {
      turn: turn,
      phase: phase,
      playerIndex: playerIndex,
      playerId: playerIndex != null ? this.players[playerIndex].id : null
    };
  }

  getBuildableEdgesForCurrentPlayer(cornerId) {
    return this.getBuildableEdgesForPlayer(this.currentPlayer, cornerId);
  }

  getBuildableCornersForCurrentPlayer() {
    return this.getBuildableCornersForPlayer(this.currentPlayer);
  }

  getBuildableEdgesForPlayer(player, cornerId) {
    if (this.phase === 'setup') {
      var corner;

      if (cornerId != null) {
        corner = this.board.corners.getById(cornerId);
      } else {
        var ownedCorners = this.board.corners.query({
          owner: this.currentPlayer
        });

        corner = _.find(ownedCorners, function(_corner) {
          var _edges = _corner.getAdjacentEdges();
          return _.every(_edges, function(edge) {
            return edge.isBuildable;
          });
        });
      }

      return corner ? corner.getAdjacentEdges() : [];

    } else {
      var edges = this.board.edges.query({
        owner: this.currentPlayer
      });

      return _.chain(edges)
        .map(function(edge) {
          return edge.getAdjacentEdges();
        })
        .flatten(true)
        .uniq(function(edge) {
          return edge.id;
        })
        .filter(function(edge) {
          return edge.isBuildable;
        })
        .value();
    }
  }

  getSettlementsForPlayer(player) {
    return this.board.corners.query({
      isSettlement: true,
      owner: player
    });
  }

  getBuildableCornersForPlayer(player) {
    var edges;

    if (this.phase === 'setup') {
      return this.board.corners.query({
        buildable: true
      });
    } else {
      edges = this.board.edges.query({
        owner: player
      });

      return _.chain(edges)
        .map(function(edge) {
          return edge.getAdjacentCorners();
        })
        .flatten(true)
        .uniq(function(corner) {
          return corner.id;
        })
        .filter(function(corner) {
          return corner.isBuildable;
        })
        .value();
    }
  }
}

module.exports = Game;
