'use strict';

var ko = require('knockout');
var screenfull = require('screenfull');
var template = require('./templates').menu;

function MenuModel(params) {
  var notificationsEnabled = ko.observable(params.notifications.isEnabled);

  this.toggleNotifications = this.toggleNotifications.bind(this);
  this.toggleFullscreen = this.toggleFullscreen.bind(this);
  this.notifications = params.notifications;

  this.notificationsEnabled = notificationsEnabled;
  this.notificationsText = ko.computed(function() {
    if (notificationsEnabled()) {
      return 'Disable Notifications';
    } else {
      return 'Enable Notifications';
    }
  });

  this.fullScreen = screenfull.enabled;
}

MenuModel.prototype.toggleFullscreen = function() {
  screenfull.toggle();
};

MenuModel.prototype.toggleNotifications = function() {
  this.notifications.toggle(
    function(enabled) {
      return this.notificationsEnabled(enabled);
    }.bind(this)
  );
};

module.exports = {
  viewModel: MenuModel,
  template: template
};
