'use strict';

var nconf = require('nconf'),
    Server = require('colonizers-server'),
    Client = require('colonizers-client'),
    tilesets = require('colonizers-client-tilesets'),
    client,
    app,
    config;

config = new nconf.Provider()
  .argv()
  .env()
  .file(__dirname + '/config.json')
  .defaults({
    PORT: 8080
  });

client = new Client({
  tilesets: tilesets
});

app = new Server({
  client: client,
  config: config
});

app.start();
