'use strict';

var mongoose = require('mongoose');

exports.register = function(server, options, next) {
  mongoose.model('AuthAttempt', require('./auth-attempt'));
  mongoose.model('GameEvent', require('./game-event'));
  mongoose.model('Room', require('./room'));
  mongoose.model('Session', require('./session'));
  mongoose.model('User', require('./user'));

  next();
};

exports.register.attributes = {
  name: 'mongoose-schemas'
};
