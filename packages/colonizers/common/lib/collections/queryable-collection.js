'use strict';

var _ = require('underscore');

function QueryableCollection(clauses) {
  this.items = [];
  this.clauses = clauses;
}

QueryableCollection.prototype.push = function(item) {
  if (Array.isArray(item)) {
    this.items.push.apply(this, item);
  } else {
    this.items.push(item);
  }
};

QueryableCollection.prototype.forEach = function(callback, thisArg) {
  this.items.forEach(callback, thisArg);
};

QueryableCollection.prototype.map = function(map, thisArg) {
  return this.items.map(map, thisArg);
};

QueryableCollection.prototype.filter = function(filter, thisArg) {
  return this.items.filter(filter, thisArg);
};

QueryableCollection.prototype.all = function() {
  return this.items;
};

QueryableCollection.prototype.getById = function(id) {
  return _.find(this.items, function(item) {
    return item.id === id;
  });
};

QueryableCollection.prototype.query = function(options) {
  var q = this.items;

  this.clauses.forEach(function(clause) {
    if (clause.valid(options)) {
      q = clause.filter(options, q);
    }
  });

  return q;
};

module.exports = QueryableCollection;
