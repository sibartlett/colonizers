'use strict';

var Factory = require('./game/factory');
var Notifications = require('./notifications');
var UserInterface = require('./user-interface');

require('./../vendor/jquery-plugins');

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

Client.Factory = Factory;
module.exports = Client;
