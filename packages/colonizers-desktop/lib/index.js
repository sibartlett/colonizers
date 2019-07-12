'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    title: 'Colonizers',
    width: 768,
    height: 500,
    'min-width': 768,
    'min-height': 500,
    center: true
  });

  mainWindow.loadUrl('file://' + __dirname + '/game.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
