'use strict';

var _ = require('underscore');

class QueryableCollection {
  constructor(clauses) {
    this.items = [];
    this.clauses = clauses;
  }

  push(item) {
    if (Array.isArray(item)) {
      this.items.push.apply(this, item);
    } else {
      this.items.push(item);
    }
  }

  forEach(callback, thisArg) {
    this.items.forEach(callback, thisArg);
  }

  map(map, thisArg) {
    return this.items.map(map, thisArg);
  }

  filter(filter, thisArg) {
    return this.items.filter(filter, thisArg);
  }

  all() {
    return this.items;
  }

  getById(id) {
    return _.find(this.items, function(item) {
      return item.id === id;
    });
  }

  query(options) {
    var q = this.items;

    this.clauses.forEach(function(clause) {
      if (clause.valid(options)) {
        q = clause.filter(options, q);
      }
    });

    return q;
  }
}

module.exports = QueryableCollection;
