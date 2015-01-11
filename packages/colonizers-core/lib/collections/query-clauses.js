'use strict';

var MathHelper = require('./../math-helper');

module.exports = {

  owner: {
    valid: function(options) {
      return options.owner || options.player;
    },
    filter: function(options, items) {
      var player = options.owner || options.player,
          playerId = typeof player === 'string' ? player : player.id;

      return items.filter(function(item) {
        return item.owner === playerId;
      });
    }
  },

  exclude: {
    valid: function(options) {
      return options.exclude;
    },
    filter: function(options, items) {
      var excludes = Array.isArray(options.exclude) ?
            options.exclude : [options.exclude];

      return items.filter(function(item) {
        return excludes.indexOf(item.id) === -1;
      });
    }
  },

  within: {
    valid: function(options) {
      return options.within;
    },
    filter: function(options, items) {
      var radius = options.within.radius,
          origin = options.within.of;

      return items.filter(function(item) {
        var distance = MathHelper.getDistance(origin, item.center);
        return distance < radius;
      });
    }
  },

  buildable: {
    valid: function(options) {
      return options.buildable === true || options.buildable === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isBuildable === options.buildable;
      });
    }
  },

  settlement: {
    valid: function(options) {
      return options.settlement === true || options.settlement === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isSettlement === options.settlement;
      });
    }
  },

  city: {
    valid: function(options) {
      return options.city === true || options.city === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isCity === options.city;
      });
    }
  },

  value: {
    valid: function(options) {
      return options.value;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.value === options.value;
      });
    }
  }

};
