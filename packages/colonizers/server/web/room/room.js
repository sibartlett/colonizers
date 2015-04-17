'use strict';

var $ = require('jquery');
var io = require('socket.io-client');
var ko = require('knockout');

$(function() {
  var vm = {
    users: ko.observableArray()
  };

  ko.applyBindings(vm);

  var socket = io();

  socket.on('room-users', function(users) {
    vm.users(users);
  });

  socket.on('game-started', function() {
    window.location.reload(true);
  });

  socket.on('connect', function() {
    socket.emit('join-room', { roomId: window.context.roomId });
  });
});
