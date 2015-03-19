'use strict';

var Notifications = require('./notifications'),
    UserInterface = require('./user-interface');

function Client(options) {
  this.options = options;

  this.notifications = new Notifications(options.emitterQueue);
  this.ui = new UserInterface({
    emitEvent: options.emitEvent,
    emitterQueue: options.emitterQueue,
    factory: options.factory,
    notifications: this.notifications
  });
  this.ui.setClientUsers(options.clientUsers);
  this.ui.bind();
}

Client.prototype.bindUI = function() {
  this.ui.bind();
};

Client.prototype.setGame = function(game) {
  this.ui.setGame(game);
};

Client.prototype.setUsers = function(users) {
  this.ui.setUsers(users);
};

Client.prototype.setClientUsers = function(users) {
  this.ui.setClientUsers(users);
};

module.exports = Client;
