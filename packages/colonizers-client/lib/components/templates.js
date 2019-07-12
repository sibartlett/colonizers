'use strict';

var fs = require('fs');

module.exports = {
  alert: fs.readFileSync(__dirname + '/alert.html', 'utf8'),
  buildModal: fs.readFileSync(__dirname + '/build-modal.html', 'utf8'),
  menu: fs.readFileSync(__dirname + '/menu.html', 'utf8'),
  player: fs.readFileSync(__dirname + '/player.html', 'utf8'),
  players: fs.readFileSync(__dirname + '/players.html', 'utf8'),
  tradeModal: fs.readFileSync(__dirname + '/trade-modal.html', 'utf8')
};
