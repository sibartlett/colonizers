'use strict';

var QueryableCollection = require('./queryable-collection');
var clauses = require('./query-clauses');

class HexCornerCollection extends QueryableCollection {
  constructor() {
    super([
      clauses.owner,
      clauses.within,
      clauses.exclude,
      clauses.buildable,
      clauses.settlement,
      clauses.city
    ]);
  }
}

class HexEdgeCollection extends QueryableCollection {
  constructor() {
    super([
      clauses.owner,
      clauses.within,
      clauses.exclude,
      clauses.buildable
    ]);
  }
}

class HexTileCollection extends QueryableCollection {
  constructor() {
    super([
      clauses.owner,
      clauses.within,
      clauses.exclude,
      clauses.buildable
    ]);
  }
}

module.exports = {
  HexCornerCollection: HexCornerCollection,
  HexEdgeCollection: HexEdgeCollection,
  HexTileCollection: HexTileCollection
};
