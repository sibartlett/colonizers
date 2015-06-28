'use strict';

var BoardEntity = require('./board-entity');

class HexCorner extends BoardEntity {
  constructor(factory, options) {
    super(factory, options);

    factory.defineProperties(this, {
      id: options.id,
      owner: null,
      isBuildable: true,
      buildType: null,
      isSettlement: this.isSettlement,
      isCity: this.isCity
    });
  }

  addToBoard(board) {
    this.board = board;
  }

  isSettlement() {
    return this.owner && this.buildType === 'settlement';
  }

  isCity() {
    return this.owner && this.buildType === 'city';
  }

  getAdjacentTiles() {
    return this.spatialQuery((board) => {
      return {
        collection: board.tiles,
        radius: board.hexInfo.circumradius * 1.1,
        center: this.center
      };
    });
  }

  getAdjacentCorners() {
    return this.spatialQuery((board) => {
      return {
        collection: board.corners,
        radius: board.hexInfo.circumradius * 1.1,
        center: this.center
      };
    });
  }

  getAdjacentEdges() {
    return this.spatialQuery((board) => {
      return {
        collection: board.edges,
        radius: board.hexInfo.circumradius * 0.6,
        center: this.center
      };
    });
  }

  buildSettlement(player) {
    var corners = this.getAdjacentCorners();

    this.owner = player.id;
    this.isBuildable = false;
    this.buildType = 'settlement';

    corners.forEach(function(corner) {
      corner.isBuildable = false;
    });
  };

  buildCity(player) {
    var corners = this.getAdjacentCorners();

    this.owner = player.id;
    this.isBuildable = false;
    this.buildType = 'city';

    corners.forEach(function(corner) {
      corner.isBuildable = false;
    });
  }
}

module.exports = HexCorner;
