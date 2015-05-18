'use strict';

var $ = require('jquery');
var io = require('socket.io-client');
var ko = require('knockout');
var _ = require('underscore');

$(function() {

  var socket = io();

  var viewModel = {
    users: ko.observableArray(),

    enableBtn: ko.observable(false),
    joined: ko.observable(false)
  };

  viewModel.showJoinBtn = ko.computed(function() {
    return viewModel.enableBtn() && !viewModel.joined();
  }, viewModel);

  viewModel.showLeaveBtn = ko.computed(function() {
    return viewModel.enableBtn() && viewModel.joined();
  }, viewModel);

  viewModel.clickJoinBtn = function() {
    socket.emit('join-room', { roomId: window.context.roomId });
  };

  viewModel.clickLeaveBtn = function() {
    socket.emit('leave-room', { roomId: window.context.roomId });
  };

  ko.applyBindings(viewModel);

  socket.on('room-users', function(users) {
    var joined = _.some(users, function(user) {
      return user.id === window.context.userId;
    });

    viewModel.users(users);
    viewModel.joined(joined);
    viewModel.enableBtn(true);
  });

  socket.on('game-started', function() {
    window.location.reload(true);
  });

  socket.on('connect', function() {
    socket.emit('enter-room', { roomId: window.context.roomId });
  });
});
