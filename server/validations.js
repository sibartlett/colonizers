'use strict';

var Joi = require('joi');

exports.register = function(server, options, next) {
  var mongoId = Joi.string().lowercase().length(24);

  server.expose('mongoId', mongoId);
  server.expose('roomId', mongoId.description('Room ID'));

  next();
};

exports.register.attributes = {
  name: 'validations'
};
