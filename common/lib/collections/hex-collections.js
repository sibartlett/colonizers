'use strict';

var QueryableCollection = require('./queryable-collection'),
    clauses = require('./query-clauses'),
    util = require('./../util');

function HexCornerCollection() {
  QueryableCollection.call(this, [
    clauses.owner,
    clauses.within,
    clauses.exclude,
    clauses.buildable,
    clauses.settlement,
    clauses.city
  ]);
}

function HexEdgeCollection() {
  QueryableCollection.call(this, [
    clauses.owner,
    clauses.within,
    clauses.exclude,
    clauses.buildable
  ]);
}

function HexTileCollection() {
  QueryableCollection.call(this, [
    clauses.within,
    clauses.exclude,
    clauses.value
  ]);
}

util.inherits(HexCornerCollection, QueryableCollection);
util.inherits(HexEdgeCollection, QueryableCollection);
util.inherits(HexTileCollection, QueryableCollection);

module.exports = {
  HexCornerCollection: HexCornerCollection,
  HexEdgeCollection: HexEdgeCollection,
  HexTileCollection: HexTileCollection
};
