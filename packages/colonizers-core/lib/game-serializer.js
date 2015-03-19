'use strict';

var _ = require('underscore');

function GameSerializer(factory) {
  this.factory = factory;
}

GameSerializer.prototype.serialize = function(game) {
  var board = this.serializeBoard(game.board),
      players = game.players.map(this.serializePlayer, this),
      result = {};

  result.board = board;
  result.players = players;

  result.allowance = game.allowance;
  result.turn = game.turn;

  if (game.currentTrade) {
    result.currentTrade = game.currentTrade;
  }

  return result;
};

GameSerializer.prototype.deserialize = function(data) {
  var game = this.factory.createGame({
    board: this.deserializeBoard(data.board),
    players: data.players.map(this.deserializePlayer, this),
    turn: data.turn || 0,
    allowance: data.allowance,
    currentTrade: data.currentTrade
  });

  this.deserializeBuildings(game.board, data.board, game.players);

  return game;
};

GameSerializer.prototype.serializePlayer = function(player) {
  return {
    id: player.id,
    resources: {
      total: player.resources.total,
      brick: player.resources.brick,
      grain: player.resources.grain,
      lumber: player.resources.lumber,
      ore: player.resources.ore,
      wool: player.resources.wool
    },
    developmentCards: {
      total: player.developmentCards.total
    },
    victoryPoints: {
      public: player.victoryPoints.public,
      actual: player.victoryPoints.actual
    },
    knightsPlayed: player.knightsPlayed,
    longestRoad: player.longestRoad
  };
};

GameSerializer.prototype.deserializePlayer = function(data, index) {
  var player = this.factory.createPlayer({
        id: data.id,
        index: index
      }),
      propName;

  if (data.resources != null) {
    for (propName in data.resources) {
      player.resources[propName] = data.resources[propName];
    }
  }
  if (data.developmentCards != null) {
    for (propName in data.developmentCards) {
      player.developmentCards[propName] = data.developmentCards[propName];
    }
  }
  if (data.victoryPoints != null) {
    for (propName in data.victoryPoints) {
      player.victoryPoints[propName] = data.victoryPoints[propName];
    }
  }
  if (data.knightsPlayed != null) {
    player.knightsPlayed = data.knightsPlayed;
  }
  if (data.longestRoad != null) {
    player.longestRoad = data.longestRoad;
  }
  return player;
};

GameSerializer.prototype.serializeBoard = function(board) {
  var tiles,
      corners,
      edges;

  tiles = board.tiles.map(function(tile) {
    return {
      id: tile.id,
      center: tile.center,
      type: tile.type,
      value: tile.value
    };
  });

  corners = board.corners.map(function(corner) {
    var result = {
      id: corner.id,
      center: corner.center,
      isSettlement: corner.isSettlement,
      isCity: corner.isCity
    };
    if (corner.owner) {
      result.owner = corner.owner;
    }
    return result;
  });

  edges = board.edges.map(function(edge) {
    var result = {
      id: edge.id,
      center: edge.center,
      ends: edge.ends
    };
    if (edge.owner) {
      result.owner = edge.owner;
    }
    return result;
  });

  return {
    hex: board.hexInfo,
    height: board.height,
    width: board.width,
    tiles: tiles,
    corners: corners,
    edges: edges
  };
};

GameSerializer.prototype.deserializeBoard = function(data) {
  var board,
      tiles,
      corners,
      edges;

  board = this.factory.createBoard({
    height: data.height,
    width: data.width,
    hexInfo: data.hex
  });

  tiles = data.tiles.map(function(tile) {
    return this.factory.createHexTile({
      id: tile.id,
      center: tile.center,
      type: tile.type,
      value: tile.value,
      hexInfo: data.hex
    });
  }, this);

  corners = data.corners.map(function(corner) {
    return this.factory.createHexCorner({
      id: corner.id,
      center: corner.center,
      hexInfo: data.hex
    });
  }, this);

  edges = data.edges.map(function(edge) {
    return this.factory.createHexEdge({
      id: edge.id,
      center: edge.center,
      ends: edge.ends,
      hexInfo: data.hex
    });
  }, this);

  board.addTiles(tiles);
  board.addEdges(edges);
  board.addCorners(corners);

  return board;
};

GameSerializer.prototype.deserializeBuildings = function(board, data, players) {
  data.corners.forEach(function(corner) {
    var player,
        hexCorner;

    if (corner.owner) {
      player = _.find(players, function(player) {
        return player.id === corner.owner;
      });
      hexCorner = board.corners.getById(corner.id);

      if (corner.isSettlement)
        hexCorner.buildSettlement(player);
      else if (corner.isCity)
        hexCorner.buildCity(player);
    }
  });

  data.edges.forEach(function(edge) {
    var player,
        hexEdge;

    if (edge.owner) {
      player = _.find(players, function(player) {
        return player.id === edge.owner;
      });
      hexEdge = board.edges.getById(edge.id);
      hexEdge.build(player);
    }
  });
};

module.exports = GameSerializer;
