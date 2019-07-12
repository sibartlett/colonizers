'use strict';

module.exports = {
  name: 'Base game',
  victoryPoints: 10,
  allowance: {
    roads: 15,
    settlements: 5,
    cities: 4
  },
  layouts: [
    {
      players: {
        min: 3,
        max: 4
      },
      numberTokens: [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11],
      terrainTiles: 'o,g,l,o,g,w,g,w,l,b,d,b,w,w,l,b,o,l,g',
      tiles: [
        '-,s',
        '-,s,s',
        's,t3,s',
        's,t4,t2,s',
        't5,t14,t1',
        's,t15,t13,s',
        't6,t19,t12',
        's,t16,t18,s',
        't7,t17,t11',
        's,t8,t10,s',
        's,t9,s',
        '-,s,s',
        '-,s'
      ]
    }
  ]
};
