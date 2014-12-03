'use strict';

var App = require('./app.js'),
    client = require('./../client/index'),
    app;

app = new App({

  client: client,
  configFile: __dirname + '/config.json'

});

app.start();
