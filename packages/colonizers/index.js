'use strict';

var nconf = require('nconf'),
    Server = require('./server'),
    app,
    config;

config = new nconf.Provider()
  .argv()
  .env()
  .file(__dirname + '/config.json')
  .defaults({
    PORT: 8080
  });

app = new Server({
  config: config
});

app.start();
