'use strict';

var PERMISSION_DEFAULT = 'default';
var PERMISSION_GRANTED = 'granted';
var PERMISSION_DENIED = 'denied';
var PERMISSION = [PERMISSION_GRANTED, PERMISSION_DEFAULT, PERMISSION_DENIED];

function Notifications(emitterQueue) {
  this.emitterQueue = emitterQueue;
  this.isSupported = window.localStorage &&
    ((window.Notification != null) ||
    (window.webkitNotifications != null) ||
    (window.navigator.mozNotification != null));
  this.isEnabled = false;
  this.checkIfPreviouslyEnabled();
  this.setupNotifications();
}

Notifications.prototype.checkIfPreviouslyEnabled = function() {
  var setting = window.localStorage.getItem('settings.notifications');
  var permitted = this.getPermission() === PERMISSION_GRANTED;

  this.isEnabled = setting && permitted ? true : false;
};

Notifications.prototype.enable = function(fn) {
  var permission = this.getPermission();

  if (permission !== PERMISSION_GRANTED) {
    this.requestPermission(function(_permission) {
      if (_permission === PERMISSION_GRANTED) {
        window.localStorage.setItem('settings.notifications', true);
        fn(this.isEnabled = true);
      } else {
        this.disable(fn);
      }
    }.bind(this));
  } else {
    window.localStorage.setItem('settings.notifications', true);
    fn(this.isEnabled = true);
  }
};

Notifications.prototype.disable = function(fn) {
  window.localStorage.removeItem('settings.notifications');
  fn(this.isEnabled = false);
};

Notifications.prototype.toggle = function(fn) {
  if (this.isEnabled) {
    this.disable(fn);
  } else {
    this.enable(fn);
  }
};

Notifications.prototype.getPermission = function() {
  if (window.Notification && window.Notification.permission) {
    return window.Notification.permission;
  } else if (window.Notification && window.Notification.permissionLevel) {
    return window.Notification.permissionLevel();
  } else if (window.webkitNotifications &&
              window.webkitNotifications.checkPermission) {
    return PERMISSION[window.webkitNotifications.checkPermission()];
  } else if (navigator.mozNotification) {
    return PERMISSION_GRANTED;
  }
};

Notifications.prototype.requestPermission = function(fn) {
  if (window.Notification && window.Notification.requestPermission) {
    window.Notification.requestPermission(fn);
  } else if (window.webkitNotifications &&
              window.webkitNotifications.checkPermission) {
    window.webkitNotifications.requestPermission(fn);
  }
};

Notifications.prototype.createNotification = function(title, body) {
  if (this.isEnabled) {
    if (window.Notification) {
      this.notification = new window.Notification(title, {
        body: body,
        tag: window.roomId
      });
    } else if (window.webkitNotifications != null) {
      this.notification =
        window.webkitNotifications.createNotification(null, title, body);
      this.notification.show();
    } else if (window.navigator.mozNotification != null) {
      this.notification =
        navigator.mozNotification.createNotification(title, body);
      this.notification.show();
    }
  }
};

Notifications.prototype.closeNotification = function() {
  if (this.notification != null) {
    if (this.notification.close != null) {
      this.notification.close();
    } else if (this.notification.cancel != null) {
      this.notification.cancel();
    }

    this.notification = null;
  }
};

Notifications.prototype.setupNotifications = function() {
  this.emitterQueue.on('start-turn', this.onNextTurn.bind(this));
};

Notifications.prototype.onNextTurn = function(data, next) {
  this.closeNotification();
  if (data.playerId === window.userId) {
    this.createNotification('Colonizers', 'Your turn');
  }

  next();
};

module.exports = Notifications;
