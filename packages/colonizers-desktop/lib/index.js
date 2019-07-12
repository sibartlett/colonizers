'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;

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
    minWidth: 768,
    minHeight: 500,
    center: true
  });

  mainWindow.loadURL('file://' + __dirname + '/game.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
