'use strict';

var ko = require('knockout');
var ViewActions = require('./view-actions');
var RootViewModel = require('./model/index');

ko.components.register('alert', require('./components/alert'));
ko.components.register('player', require('./components/player'));
ko.components.register('players', require('./components/players'));
ko.components.register('game-menu', require('./components/menu'));
ko.components.register('stage', require('./components/stage'));
ko.components.register('build-modal', require('./components/build-modal'));
ko.components.register('trade-modal', require('./components/trade-modal'));

ko.bindingHandlers.component.preprocess = function(val) {
  if (val) {
    if (val.indexOf('{') < 0) {
      val = '{ name: ' + val + ', params: $root }';
    }
    else if (val.indexOf('params') < 0) {
      val = val.replace('}', 'params:$root}');
    }
  }

  return val;
};

function UserInterface(options) {
  this.emit = this.emit.bind(this);
  this.onBoardClick = this.onBoardClick.bind(this);
  this.onBuildSettlement = this.onBuildSettlement.bind(this);
  this.onBuildCity = this.onBuildCity.bind(this);
  this.onBuildRoad = this.onBuildRoad.bind(this);
  this.onTurnEnd = this.onTurnEnd.bind(this);
  this.onTurnStart = this.onTurnStart.bind(this);

  this.game = null;
  this.emitEvent = options.emitEvent;
  this.emitterQueue = options.emitterQueue;

  this.viewModel = new RootViewModel({
    actions: new ViewActions(this.emit),
    emitterQueue: options.emitterQueue,
    notifications: options.notifications,
    factory: options.factory
  });

  this.viewModel.ui = {
    buttons: ko.observable(false)
  };
  this.viewModel.events = {
    onBuildRoad: this.onBuildRoad,
    onBuildSettlement: this.onBuildSettlement,
    onBuildCity: this.onBuildCity
  };

  this.viewModel.subscribe('turn', function() {
    this.onTurnEnd();

    // TODO: Maybe there's a better way to do this?
    // This method call needs to be delayed to allow model to update first
    setTimeout(this.onTurnStart.bind(this), 10);
  }.bind(this));
}

UserInterface.prototype.emit = function(event, data) {
  var thisPlayerId = this.viewModel.thisPlayer && this.viewModel.thisPlayer.id;
  this.emitEvent(thisPlayerId, event, data);
};

UserInterface.prototype.setUsers = function(users) {
  this.viewModel.users = users;
};

UserInterface.prototype.setClientUsers = function(userIds) {
  this.viewModel.clientUsers = userIds;
};

UserInterface.prototype.setGame = function(game) {
  if (this.game) {
    this.game = null;
    this.viewModel.game = null;
  }

  this.game = game;
  this.viewModel.game = game;

  this.game.board.corners.forEach(function(corner) {
    corner.on('click', this.onBoardClick);
  }, this);

  this.game.board.edges.forEach(function(edge) {
    edge.on('click', this.onBoardClick);
  }, this);
};

UserInterface.prototype.bind = function() {
  ko.applyBindings(this.viewModel);
};

UserInterface.prototype.onTurnStart = function() {
  if (!this.viewModel.myTurn) {
    return;
  }

  if (this.game.phase === 'setup') {
    var ownedCorners = this.game.board.corners.query({
      owner: this.game.currentPlayer
    });
    var ownedEdges = this.game.board.edges.query({
      owner: this.game.currentPlayer
    });

    if (ownedCorners.length > ownedEdges.length) {
      this.game.showBuildableEdges();
    } else if (ownedCorners.length < 2) {
      this.game.showBuildableSettlements();
    }
  } else if (this.game.phase === 'playing') {
    this.viewModel.ui.buttons(true);
  }
};

UserInterface.prototype.onTurnEnd = function() {
  this.viewModel.ui.buttons(false);
};

UserInterface.prototype.onBuildRoad = function() {
  this.game.showBuildableEdges();
};

UserInterface.prototype.onBuildSettlement = function() {
  this.game.showBuildableSettlements();
};

UserInterface.prototype.onBuildCity = function() {
  this.game.showBuildableCities();
};

UserInterface.prototype.onBoardClick = function(data) {
  if (!this.viewModel.myTurn) {
    return;
  }

  if (this.game.phase === 'setup') {
    this.game.hideBuildableEntities();
    this.emit('build-' + data.type, {
      buildId: data.id
    });
    if (data.type === 'settlement') {
      this.game.showBuildableEdges(data.id);
    }
  } else {
    this.game.hideBuildableEntities();
    this.emit('build-' + data.type, {
      buildId: data.id
    });
  }
};

module.exports = UserInterface;
