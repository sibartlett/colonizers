'use strict';

var _ = require('underscore');

function Game(factory, options) {
  factory.defineProperties(this, {
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

Game.prototype.offerTrade = function(options) {
  this.currentTrade = {
    owner: options.playerId,
    resources: options.resources
  };
};

Game.prototype.setTurn = function(turn) {
  var data = this.getDataForTurn(turn);
  this.turn = data.turn;
  this.phase = data.phase;
  this.currentPlayer = this.players[data.playerIndex] || null;
};

Game.prototype.getPlayerById = function(id) {
  return _.find(this.players, function(player) {
    return player.id === id;
  });
};

Game.prototype.getDataForTurn = function(turn) {
  var phase = 'waiting',
      playerIndex = null,
      prevTurn;

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
};

Game.prototype.getBuildableEdgesForCurrentPlayer = function(cornerId) {
  return this.getBuildableEdgesForPlayer(this.currentPlayer, cornerId);
};

Game.prototype.getBuildableCornersForCurrentPlayer = function() {
  return this.getBuildableCornersForPlayer(this.currentPlayer);
};

Game.prototype.getBuildableEdgesForPlayer = function(player, cornerId) {
  var corner,
      ownedCorners,
      edges;

  if (this.phase === 'setup') {
    if (cornerId != null) {
      corner = this.board.corners.getById(cornerId);
    } else {
      ownedCorners = this.board.corners.query({
        owner: this.currentPlayer
      });

      corner = _.find(ownedCorners, function(corner) {
        var edges = corner.getAdjacentEdges();
        return _.every(edges, function(edge) {
          return edge.isBuildable;
        });
      });
    }
    return corner ? corner.getAdjacentEdges() : [];
  } else {
    edges = this.board.edges.query({
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
};

Game.prototype.getSettlementsForPlayer = function(player) {
  return this.board.corners.query({
    isSettlement: true,
    owner: player
  });
};

Game.prototype.getBuildableCornersForPlayer = function(player) {
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
};

module.exports = Game;
