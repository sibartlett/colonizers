'use strict';

var circumradius = 100;
var apothem = Math.sqrt(
  Math.pow(circumradius, 2) - Math.pow(circumradius / 2, 2)
);

module.exports = {
  circumradius: circumradius,
  apothem: apothem
};
