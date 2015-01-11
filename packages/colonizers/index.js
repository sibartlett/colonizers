'use strict';

var nconf = require('nconf'),
    Server = require('colonizers-server'),
    client = require('colonizers-client'),
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
  client: client,
  config: config
});

app.start();
