'use strict';

var Notifications = require('./notifications'),
    UserInterface = require('./user-interface');

function Client(options) {
  this.options = options;

  this.notifications = new Notifications(options.emitterQueue);
  this.ui = new UserInterface({
    socket: options.socket,
    emitterQueue: options.emitterQueue,
    factory: options.factory,
    notifications: this.notifications
  });
}

Client.prototype.bindUI = function() {
  this.ui.bind();
};

Client.prototype.setGame = function(game) {
  this.ui.setGame(game);
};

module.exports = Client;
