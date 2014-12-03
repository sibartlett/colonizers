'use strict';

function round(number, dp) {
  var dp2 = Math.pow(10, dp);
  return Math.round(number * dp2) / dp2;
}

function getAngle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getEndpoint(origin, angle, distance) {
  var radians = angle * Math.PI / 180;
  return {
    x: round(origin.x + distance * Math.sin(radians), 3),
    y: round(origin.y + distance * Math.cos(radians), 3)
  };
}

module.exports = {
  getAngle: getAngle,
  getDistance: getDistance,
  getEndpoint: getEndpoint,
  round: round
};
