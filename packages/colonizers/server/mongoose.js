'use strict';

var Hoek = require('hoek');
var mongoose = require('mongoose');

exports.register = function(server, options, next) {
  options = Hoek.applyToDefaults(
    {
      mongodbUrl: null
    },
    options
  );

  Hoek.assert(
    options.mongodbUrl,
    'Missing required mongodbUrl property in options.'
  );

  server.expose('mongoose', mongoose);
  mongoose.connect(options.mongodbUrl, next);
};

exports.register.attributes = {
  name: 'mongoose'
};
