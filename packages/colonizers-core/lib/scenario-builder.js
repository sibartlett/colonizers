'use strict';

var _ = require('underscore'),
    MathHelper = require('./math-helper'),
    hexInfo = require('./hex-info');

function ScenarioBuilder(options) {
  var defaults = {
        shuffleTerrainTiles: true,
        shuffleNumberTokens: false
      },
      gameOptions = _.extend(defaults, options.gameOptions || {});

  this.scenario = options.scenario;
  this.players = options.numPlayers;
  this.options = gameOptions;
}

ScenarioBuilder.prototype.getLayout = function() {
  var filter = function(layout) {
    return layout.players.min === this.players ||
      layout.players.max >= this.players;
  };

  return _.find(this.scenario.layouts, filter.bind(this));
};

ScenarioBuilder.prototype.getTileLayout = function(layout) {
  var circumradius = hexInfo.circumradius,
      apothem = hexInfo.apothem,
      tiles,
      counts,
      max,
      maxIndex,
      boardHeight,
      boardWidth,
      maxOffsetX,
      minOffsetX,
      offsetX,
      offsetY;

  tiles = layout.tiles.map(function(row) {
    return row.split(',');
  });
  counts = tiles.map(function(row) {
    return row.length;
  });

  max = _.max(counts);
  maxIndex = (counts.indexOf(max)) % 2;

  tiles.forEach(function(row, index) {
    var length = index % 2 === maxIndex ? max : max - 1,
        add = length - row.length,
        i;
    for (i = 0; i < add; i++) {
      row.push('-');
    }
  });

  boardHeight = apothem * (tiles.length + 1);
  boardWidth = ((max * 2) + (max - 1)) * hexInfo.circumradius;
  maxOffsetX = -(boardWidth / 2 - circumradius);
  minOffsetX = circumradius * 1.5 + maxOffsetX;
  offsetX = [
    maxIndex === 0 ? maxOffsetX : minOffsetX,
    maxIndex === 1 ? maxOffsetX : minOffsetX
  ];
  offsetY = -(boardHeight / 2 - apothem);

  return {
    firstRowIsMax: maxIndex === 0,
    firstRowIsMin: maxIndex === 1,
    rows: tiles.length,
    maxRowLength: max,
    evenRowLength: maxIndex === 0 ? max : max - 1,
    oddRowLength: maxIndex === 1 ? max : max - 1,
    tiles: tiles,
    boardHeight: boardHeight,
    boardWidth: boardWidth,
    offsetX: offsetX,
    offsetY: offsetY
  };
};

ScenarioBuilder.prototype.processCorners = function(board, corners) {
  var corners1 = _.chain(corners)
    .map(function(corner) {
      return {
        point: corner,
        x: MathHelper.round(corner.x, 0),
        y: MathHelper.round(corner.y, 0)
      };
    })
    .uniq(function(corner) {
      return corner.x + ',' + corner.y;
    })
    .sortBy(function(corner) {
      return corner.x;
    })
    .sortBy(function(corner) {
      return corner.y;
    })
    .value();

  corners1.forEach(function(corner, index) {
    var cornerId = 'C' + (index + 1);
    board.corners.push({
      id: cornerId,
      center: corner.point
    });
  });
};

ScenarioBuilder.prototype.processEdges = function(board, edges) {
  var edges1 = _.chain(edges)
    .map(function(edge) {
      return {
        center: edge.center,
        ends: edge.ends,
        x: MathHelper.round(edge.center.x, 0),
        y: MathHelper.round(edge.center.y, 0)
      };
    })
    .uniq(function(edge) {
      return edge.x + ',' + edge.y;
    })
    .sortBy(function(edge) {
      return edge.x;
    })
    .sortBy(function(edge) {
      return edge.y;
    })
    .value();

  edges1.forEach(function(edge, index) {
    var edgeId = 'E' + (index + 1);
    board.edges.push({
      id: edgeId,
      center: edge.center,
      ends: edge.ends
    });
  });
};

ScenarioBuilder.prototype.getScenario = function() {
  var circumradius = hexInfo.circumradius,
      apothem = hexInfo.apothem,
      layout = this.getLayout(),
      numberTokens = layout.numberTokens,
      terrainTiles = layout.terrainTiles.split(','),
      tileLayout = this.getTileLayout(layout),
      seaTiles = [],
      resourceTiles = [],
      tileId = 0,
      desert = 0,
      corners = [],
      edges = [],
      board;

  if (this.options.shuffleNumberTokens) {
    numberTokens = _.shuffle(numberTokens);
  }

  if (this.options.shuffleTerrainTiles) {
    terrainTiles = _.shuffle(terrainTiles);
  }

  tileLayout.tiles.forEach(function(tiles, i) {
    tiles.forEach(function(tile, j) {
      var x,
          y,
          center,
          tileNo;

      if (tile !== '' && tile !== '-') {
        tileId++;
        x = tileLayout.offsetX[i % 2] + (circumradius * 3) * j;
        y = apothem * i + tileLayout.offsetY;
        center = {
          x: MathHelper.round(x, 3),
          y: MathHelper.round(y, 3)
        };

        if (tile[0] === 't') {
          tileNo = -1 + parseInt(tile.substring(1), 10);
          resourceTiles[tileNo] = {
            id: 'T' + tileId,
            center: center
          };
        } else {
          seaTiles.push({
            id: 'T' + tileId,
            center: center
          });
        }
      }
    });
  });

  board = {
    hex: hexInfo,
    height: tileLayout.boardHeight,
    width: tileLayout.boardWidth,
    tiles: [],
    corners: [],
    edges: []
  };

  seaTiles.forEach(function(tile) {
    board.tiles.push({
      id: tile.id,
      center: tile.center,
      type: 'sea',
      value: 0
    });
  });

  resourceTiles.forEach(function(tile, index) {
    switch (terrainTiles[index]) {
      case 'd':
        tile.tileType = 'desert';
        break;
      case 'b':
        tile.tileType = 'brick';
        break;
      case 'g':
        tile.tileType = 'grain';
        break;
      case 'l':
        tile.tileType = 'lumber';
        break;
      case 'o':
        tile.tileType = 'ore';
        break;
      case 'w':
        tile.tileType = 'wool';
    }
    var value = 0,
        angle;

    if (tile.tileType === 'desert') {
      desert += 1;
    } else {
      value = numberTokens[index - desert];
    }
    for (angle = 30; angle <= 330; angle += 60) {
      corners.push(MathHelper.getEndpoint(tile.center, angle, circumradius));
    }
    for (angle = 0; angle <= 300; angle += 60) {
      edges.push({
        center: MathHelper.getEndpoint(tile.center, angle, apothem),
        ends: [
          MathHelper.getEndpoint(tile.center, angle - 30, circumradius),
          MathHelper.getEndpoint(tile.center, angle + 30, circumradius)
        ]
      });
    }
    board.tiles.push({
      id: tile.id,
      center: tile.center,
      type: tile.tileType,
      value: value
    });
  });

  this.processCorners(board, corners);
  this.processEdges(board, edges);
  return {
    allowance: this.scenario.allowance,
    board: board
  };
};

module.exports = ScenarioBuilder;
