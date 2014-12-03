(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('jquery-plugins');

var io = require('socket.io-client'),
    common = require('./../../common/index'),
    Factory = require('./game/factory'),
    Notifications = require('./notifications'),
    UserInterface = require('./user-interface'),

    game = null,
    factory = new Factory(),
    gameSerializer = new common.GameSerializer(factory),

    socket = io(),
    emitterQueue = new common.EmitterQueue(socket),
    gameCoordinator = new common.GameCoordinator(emitterQueue),
    notifications = new Notifications(emitterQueue),
    ui = new UserInterface(socket, emitterQueue, notifications, factory);

ui.bind();

socket.on('room_closed', function() {
  window.location = '/lobby';
});

socket.on('connect', function() {
  socket.emit('room', window.roomId);
});

socket.on('GameData', function(data) {
  game = gameSerializer.deserialize(data);
  emitterQueue.kill();
  gameCoordinator.setGame(game);
  ui.setGame(game);
});

},{"./../../common/index":35,"./game/factory":18,"./notifications":29,"./user-interface":33,"jquery-plugins":undefined,"socket.io-client":undefined}],2:[function(require,module,exports){
module.exports = "<div class=\"alert alert-info alert-fixed-top\" style=\"display: none\" data-bind=\"visible: message\">\n  <button type=\"button\" class=\"close\" data-bind=\"click: dismiss\">\n    <span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span>\n  </button>\n  <span data-bind=\"text: message\"></span>\n  <div class=\"dice\" data-bind=\"visible: showDice\">\n    <img border=\"0\" width=\"32\" height=\"32\"\n      data-bind=\"attr: { src: die1.imageSrc }\" />\n    <img border=\"0\" width=\"32\" height=\"32\"\n      data-bind=\"attr: { src: die2.imageSrc }\" />\n  </div>\n</div>\n";

},{}],3:[function(require,module,exports){
'use strict';

var async = require('async'),
    template = require('./alert.html'),
    observableProps = require('./../game/observable-properties'),
    DieModel = require('./d6');

function AlertModel(roomModel) {
  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    message: null,
    showDice: false
  });

  this.die1 = new DieModel();
  this.die2 = new DieModel();

  roomModel.subscribe('game', this.onGameLoaded.bind(this));
  roomModel.emitterQueue.on('NextTurn', this.onNextTurn.bind(this));
  roomModel.emitterQueue.on('DiceRoll', this.onDiceRoll.bind(this));
}

AlertModel.prototype.dismiss = function() {
  this.message = null;
  this.showDice = false;
};

AlertModel.prototype.onGameLoaded = function(game) {
  if (game && game.turn > 0) {
    this.onNextTurn({
      playerId: game.currentPlayer.id
    });
  }
};

AlertModel.prototype.onNextTurn = function(data, next) {
  var currentPlayer = this.roomModel.currentPlayer;

  this.showDice = false;
  if (data.playerId === window.userId) {
    this.message = 'Your turn';
  } else {
    this.message = currentPlayer.user.name + '\'s turn';
  }
  if (next) {
    next();
  }
};

AlertModel.prototype.onDiceRoll = function(data, next) {
  var currentPlayer = this.roomModel.currentPlayer,
      name = currentPlayer.user.name,
      done,
      die1,
      die2;

  this.showDice = true;

  if (currentPlayer.id === window.userId) {
    this.message = 'You are rolling the dice';
    done = function() {
      this.message = 'You rolled ' + data.total;
      next();
    }.bind(this);
  } else {
    this.message = name + ' is rolling the dice';
    done = function() {
      this.message = name + ' rolled ' + data.total;
      next();
    }.bind(this);
  }

  die1 = function(callback) {
    this.die1.start(data.die1, callback);
  }.bind(this);

  die2 = function(callback) {
    this.die2.start(data.die2, callback);
  }.bind(this);

  return async.parallel([die1, die2], done);
};

module.exports = {
  viewModel: AlertModel,
  template: template
};

},{"./../game/observable-properties":25,"./alert.html":2,"./d6":7,"async":undefined}],4:[function(require,module,exports){
module.exports = "<div class=\"modal fade\" id=\"buildModal\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\"><span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span></button>\n        <h4 class=\"modal-title\">Build/upgrade</h4>\n      </div>\n      <div class=\"modal-body\">\n\n        <div class=\"media\">\n          <a class=\"media-left\" href=\"#\">\n            <img class=\"media-object\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIi8+PHRleHQgdGV4dC1hbmNob3I9Im1pZGRsZSIgeD0iMzIiIHk9IjMyIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEycHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+NjR4NjQ8L3RleHQ+PC9zdmc+\" alt=\"...\">\n          </a>\n          <div class=\"media-body\">\n            <h4 class=\"media-heading\">\n              Road\n              <span class=\"badge lumber\" title=\"Lumber\">1</span>\n              <span class=\"badge brick\" title=\"Brick\">1</span>\n            </h4>\n          </div>\n          <div class=\"media-right\">\n            <button type=\"button\" class=\"btn btn-default\" data-bind=\"enable: canBuildRoad, click: buildRoad\">Build</button>\n            <br>\n            <em><span data-bind=\"text: allowanceRoads\"></span> available</em>\n          </div>\n        </div>\n\n        <div class=\"media\">\n          <a class=\"media-left\" href=\"#\">\n            <img class=\"media-object\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIi8+PHRleHQgdGV4dC1hbmNob3I9Im1pZGRsZSIgeD0iMzIiIHk9IjMyIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEycHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+NjR4NjQ8L3RleHQ+PC9zdmc+\" alt=\"...\">\n          </a>\n          <div class=\"media-body\">\n            <h4 class=\"media-heading\">\n              Settlement\n              <span class=\"badge lumber\" title=\"Lumber\">1</span>\n              <span class=\"badge brick\" title=\"Brick\">1</span>\n              <span class=\"badge wool\" title=\"Wool\">1</span>\n              <span class=\"badge grain\" title=\"Grain\">1</span>\n            </h4>\n          </div>\n          <div class=\"media-right\">\n            <button type=\"button\" class=\"btn btn-default\" data-bind=\"enable: canBuildSettlement, click: buildSettlement\">Build</button>\n            <br>\n            <em><span data-bind=\"text: allowanceSettlements\"></span> available</em>\n          </div>\n        </div>\n\n        <div class=\"media\">\n          <a class=\"media-left\" href=\"#\">\n            <img class=\"media-object\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIi8+PHRleHQgdGV4dC1hbmNob3I9Im1pZGRsZSIgeD0iMzIiIHk9IjMyIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEycHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+NjR4NjQ8L3RleHQ+PC9zdmc+\" alt=\"...\">\n          </a>\n          <div class=\"media-body\">\n            <h4 class=\"media-heading\">\n              City\n              <span class=\"badge grain\" title=\"Grain\">2</span>\n              <span class=\"badge ore\" title=\"Ore\">3</span>\n            </h4>\n          </div>\n          <div class=\"media-right\">\n            <button type=\"button\" class=\"btn btn-default\" data-bind=\"enable: canBuildCity, click: buildCity\">Build</button>\n            <br>\n            <em><span data-bind=\"text: allowanceCities\"></span> available</em>\n          </div>\n        </div>\n\n\n      </div>\n    </div>\n  </div>\n</div>\n";

},{}],5:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    template = require('./build-modal.html'),
    observableProps = require('./../game/observable-properties');

function BuildModalModel(roomModel) {

  this.buildCity = this.buildCity.bind(this);
  this.buildSettlement = this.buildSettlement.bind(this);
  this.buildRoad = this.buildRoad.bind(this);
  this.resetCanBuildProps = this.resetCanBuildProps.bind(this);

  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    allowanceRoads: 0,
    allowanceSettlements: 0,
    allowanceCities: 0,
    canBuildRoad: false,
    canBuildSettlement: false,
    canBuildCity: false
  });

  var resetAllowances = this.resetAllowances.bind(this);
  roomModel.subscribe('thisPlayer', resetAllowances);
  roomModel.subscribe('game', resetAllowances);

  roomModel.emitterQueue.on('Build', this.onBuild.bind(this));
}

BuildModalModel.prototype.resetAllowances = function() {
  var thisPlayer = this.roomModel.thisPlayer,
      player = thisPlayer ? thisPlayer.player : null,
      game = this.roomModel.game,
      edges,
      corners;

  this.allowanceRoads = 0;
  this.allowanceSettlements = 0;
  this.allowanceCities = 0;

  if (player && game && game.allowance) {
    edges = game.board.edges.query({
      owner: player
    });

    corners = game.board.corners.query({
      owner: player
    });

    this.allowanceRoads = game.allowance.roads - edges.length;
    this.allowanceSettlements = game.allowance.settlements - corners.length;
    this.allowanceCities = game.allowance.cities;
  }

  this.resetCanBuildProps();
};

BuildModalModel.prototype.resetCanBuildProps = function() {
  var thisPlayer = this.roomModel.thisPlayer,
      player = thisPlayer ? thisPlayer.player : null,
      game = this.roomModel.game,
      edges,
      corners,
      roads,
      settlements;

  this.canBuildRoad = false;
  this.canBuildSettlement = false;
  this.canBuildCity = false;

  if (game && player && player.hasResources) {

    edges = game.getBuildableEdgesForPlayer(player);
    corners = game.getBuildableCornersForPlayer(player);

    roads = this.allowanceRoads > 0 &&
            edges.length > 0 &&
            player.hasResources({
              lumber: 1,
              brick: 1
            });

    this.canBuildRoad = roads;

    settlements = this.allowanceSettlements > 0 &&
                  corners.length > 0 &&
                  player.hasResources({
                    lumber: 1,
                    brick: 1,
                    wool: 1,
                    grain: 1
                  });

    this.canBuildSettlement = settlements;

    this.canBuildCity = false;
  }
};

BuildModalModel.prototype.onBuild = function(data, next) {
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer) {
    if (thisPlayer.id === data.playerId) {
      if (data.buildType === 'edge') {
        this.allowanceRoads(this.allowanceRoads - 1);
      }
      if (data.buildType === 'corner') {
        this.allowanceSettlements(this.allowanceSettlements - 1);
      }
    }
  }
  this.resetCanBuildProps();
  next();
};

BuildModalModel.prototype.buildRoad = function() {
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableEdges();
};

BuildModalModel.prototype.buildSettlement = function() {
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableSettlements();
};

BuildModalModel.prototype.buildCity = function() {

};

module.exports = {
  viewModel: BuildModalModel,
  template: template
};

},{"./../game/observable-properties":25,"./build-modal.html":4,"jquery":undefined}],6:[function(require,module,exports){
'use strict';

module.exports = {
  blank: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPz8/Pv7+/r6+vn5+fj4+Pf39/b29vT09PLy8vDw8O/v7+7u7u3t7erq6ubm5t7e3tbW1tXV1c7Ozs3NzczMzMjIyMfHx8bGxsXFxcTExMPDw8DAwLy8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5WVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3l5eXh4eHZ2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGBgYFFRUVBQUExMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozk5OTg4ODc3NzU1NTQ0NC4uLi0tLScnJyQkJCEhISAgIBwcHBoaGhYWFhMTE////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAIAAgAAAINQArCRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJUmRAADs=',
  die1: {
    die: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPz8/Pv7+/r6+vn5+fj4+Pf39/b29vT09PLy8vDw8O/v7+7u7u3t7erq6ubm5t7e3tbW1tXV1c7Ozs3NzczMzMjIyMfHx8bGxsXFxcTExMPDw8DAwLy8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5WVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3l5eXh4eHZ2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGBgYFFRUVBQUExMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozk5OTg4ODc3NzU1NTQ0NC4uLi0tLScnJyQkJCEhISAgIBwcHBoaGhYWFhMTE////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJUALAAAAAAgACAAAAj+ACsJHEiwoMGDCBEaQMCwoYGEBg88mPjAQQMFBQIA2MgRQIEEDRxQfPCQoAEKDRgsUIDggAECAwJo7AgggIABBAwYSBBhAEEKLjZoGEo0QwYMGC5YWLq0QoWlFy5kECGB4AYdIj588NChgweuXbtyGDs2bAcOHlqMIGhCB4kQWrV6iCv361e6d12sHbhDR4kQIAILHjw4BODCLkoQDLLDhIjHkCNDNiwZ8gsYBJXsQEGCxIjPnz2DBt1ZNOgXQQhm4ZHCRInXsGPLnk0ChhSCXnioQHGit28TwIMH990bOAwoBM/0YJGieXMU0KNLh+6c94kYTwii+dFihYrv4L/+V+lTaA2L8OFTzEA+MA2QFyxWyJ+/ggul+5TqrGDBv3/8GrcNpEYQMLjQwoEItsAIfvcF4cKDED54wxQErSGEDDC8oOGGL0TCICVRwJAhhy/gQAVBbAxBQwwitiiiIAxKkkMMNNZIow5VENQGETXMIMOPQMpghCP3TSKGDDMkqaSPPFhBkBtG3FBDDTRUaSUNOoihRhFXTlnlDDT0kEVySOBgw5k2TKnmmmiuSWUNPwQoEBhK6IDDDXjmqeeee9pwQxBKEFQFEzzkgMOhh+ag6KKMIuqoEEMQ1IQTPfSlw6U6WIrppTtouikROhA0RBQ/9MDDqaimmqqpqvJgBGaLA+EwRRA+1GrrrbjmWusRLBD0QhVCAAHED8QKa+yxwhKrrA8/JPGBVWhMAcUTTjTRBBNLKKGtEkt06+23SzjRRQUEDRCHIogYMgggfehhBx112HEHHnnosccefPjxByCBCHJIGwEUBAAFKNCQxBVjyIEHIgw3zDAecpihhRI2sEABABBlrPHGHB8UEAA7',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn52dnZycnJubm5mZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIqKioiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGRkZGNjY2JiYmFhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFZWVlVVVVNTU1JSUlFRUVBQUE9PT01NTUtLS0lJSUhISEdHR0ZGRkVFRUNDQ0FBQUBAQDw8PDo6Ojc3NzY2NjU1NTQ0NDAwMC0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAKwALAAAAAAgACAAAAj+AFkJHEiwoMGDCBESWNAAwocNDQgknMgKAYMFBAAIEMDhiZ06a7IA+aAAAEVWChggADDAgIIGEjo4mUNpVKdJjQjh8TJjwUEADBQEIKDAwYQLGjp8iGEFz6ZVUFepMvVJkqEuF0wKVHDgAAMIFTBo2NDBwwcQM7A4jcoW6qlNgyYIhBDBAoYMYzlw6FBWhI0teDS1HbwKESsAGRLn5euhsYcROLrgyUS47SlWA8Zu2Nv47FkQJXZ4uYOpctsACPYyPhsihIgRJEz0+HLnkmm2AxSUNQvC9YgSwEugABLmjqXbUVN+WN57BOwSJkycUBFEjJ3jyFc1cACi92sS0KX+o0CxYsiY2tlXTXgQwjmJJU9OnECRon4LImXwlM7u4UFwIamoskQKKqzAAgsuFGFGHpRlJ8ID8p0gB1R6rNCCCxjCcMQZejzl4AP1pfAHVIVciOELMSSBxh6cpPdggSrAARUeLrxg4wszKKEGH564CMGBLAhRyilHvABDDEjSwMQafXzio4kuEHEEkjHIYKUNTrDhByjpZcCAkUZWKcMMZJJ5Q5aAhJKeBAtYKeYMNMRZw5w4ONGGIKKkt0ACcZJJw5w22HDDoDg00cYgpKSnAAE12ACooDhEikMOOhhKSCnpDTCAoIPeMGkOlOqgww5MtGGIKekBAAAQO4Aa6g58sMLKAxNsIHJKdpwItEIdWiQhhA898CAsDz30QGsiqGRHxEALSJFIH2xsAYURQvzggw+0KpKKaaaYEYFBArAAByWQCAKHGFQwQQUcjxCWSh81SDRRABZIIQgnkyhyCCXbQmWKIVNkMMBJBgGgAAdDlAGGDxmURPDDELMSEAA7',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP////39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6uTk5OPj4+Li4uDg4N/f393d3dzc3NnZ2djY2NbW1tXV1dHR0dDQ0M7Ozs3NzczMzMXFxcLCwr+/v729vbu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsKurq6SkpKGhoZ2dnZaWlpCQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH5+fnt7e3R0dHBwcGxsbGlpaWJiYl5eXkxMTEpKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozk5OTg4ODU1NTQ0NDIyMjExMS4uLi0tLSkpKSUlJSMjIx0dHRoaGhcXFxQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkIAIAALAAAAAAgACAAAAj+AAEJHBhAAYQJFjBguMCwoUILEyQoGDCwYkUPCwJo3MhRowCODw5wsFhRAoaPHVMW6EjBwQSSAklkTEmzIwMCIWAaILGSpogcQGIYoClgQwGSHzIMoInDjVM3UmpC8EBSRQSUHZs8dXOmZ8cDJCwWUIGgpoIeUa4w2VCTgAgCFTl88Eqgpt0AAi5kqHjiwtK7gAVICDvwhQSsgO0qMDFQgIsFiBPTNFAigMAJJA5EltyRgIcIAj14MCCgdEfTREurHlBhJCASHSREmB3hgQMHtm8/eAABwmwHDRQkQHAAAQMLIwTWoIEihQoVK1iwaNHChfUXL2Boh/HCBQsVKE7HmDDRQobAHk6UHCkyBIiPHjx26Jifo359HTx6/AgihIgRJEvcoFwaZpAxRhhfdLFFFldYUUUVVFAxxYRUYKEFF16AIQYZZaAxg0AjbCViGySWyMaJbYi41QeXqejiiy46MNAZMNboYhkVQWHjjk89UVENPPJYQ0UaBLnjXgSVYSSMZVhWURJLvqgESSBE6WJyFgXAhZVbgSEATDRw+ZQNMAHCQBpiqgFBmYCMUAWaRq6xRQlsViQAAxRgAMKefO6JAQUMHAVTQAA7'
  },
  die2: {
    die: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPz8/Pv7+/r6+vn5+fj4+Pf39/b29vT09PLy8vDw8O/v7+7u7u3t7erq6ubm5t7e3tbW1tXV1c7Ozs3NzczMzMjIyMfHx8bGxsXFxcTExMPDw8DAwLy8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5WVlZSUlJOTk5GRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3h4eHZ2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGJiYmBgYF1dXVlZWVFRUVBQUExMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozk5OTg4ODc3NzU1NTQ0NC8vLy4uLiwsLCoqKicnJyIiIiEhISAgIB8fHxUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJkALAAAAAAgACAAAAj+ADMJHEiwoMGDCBEaQMCwoYGEBg88mPjAQQMFBQIA2MgRQIEEDRxQfPCQoAEKDRgsUIDggAECAwJo7AgggIABBAwYSBBhAEEKLjZoGEo0QwYMGC5YWLq0QoWlFy5kECGB4AYdIj586MDVgweuYDmIFVujy5QQHDy0GEHQhA4SIbR69aC17lyvUyphwsRIxQcXbAfu0FEiBIjDiBMrjrR3bxwQLkoQDLLDxAgRmEWEyMw5RAgUjfcSEvECBsEkO1CQGMGa9erWsEcwunRpr5wRL4IQxMIjhYkSwIMLF06iCKXajmSQgBGFIBceKlCcMEH9xHTq2LO/sCJFRQkTMJ7+ECzTg0WK8+dRqF/PXr319ydiOCFo5kcLFfjz69/P//wM8QOdAcQLKxRo4IEIJlhgDc0NhEYQMLjQwoQUVmjhhS3cIAVBaQghwwsghijiiCS+4AIOUxCkxhA0yADDizDGKKOMMcCgAxUErUFEDTPMIMOPQAYp5JA8VEEQG0XcUEMNNDTp5JNQPjkDDT1gMd4RONig5Q5LdumlljZ4yWQNPzQokBdJ6IADGJFc0ggUN8Qp55x0xhlEEgRRsQQPTViCCW2UAJHDoIQSisOhiOIgxBAEMdFED2/sRdslX+hg6aU6DIbppUToQNAQUPxwxp+TPsfDqaimqmoRpg2EgxSQQQwByaSPBOHDrbjmqmsPRrBA0AtUCAGEEnUsYocSQCSr7LI/NNusDz8g8YFVZkjxhBNNMMHEEkok4W0SSoQr7rhKNLFFBQQN8MYiiRxCSCB+7HFHHXbcgUceeuzBBx99/AFIIIIMgsgaARQEAAUo0ICEFWHIkUciEEcMcR5ykJFFEjawQAEAEHXs8ccgHxQQADs=',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn52dnZycnJubm5mZmZiYmJeXl5aWlpWVlZSUlJOTk5GRkZCQkI+Pj46Ojo2NjYyMjIqKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGZmZmRkZGNjY2FhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFdXV1ZWVlVVVVNTU1JSUlBQUE9PT01NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUNDQ0FBQUBAQDw8PDo6Ojc3NzY2NjU1NTQ0NDIyMjExMTAwMC4uLi0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIALIALAAAAAAgACAAAAj+AGUJHEiwoMGDCBESWNAAwocNDQgknCgLAYMFBAAIEMDBiZ06a7IA+aAAAEVZChggADDAgIIGEjo0mZMJlShMjwzh8TJjwUEADBQEIKDAwYQLGjp8iGEFD6hYUGPBYkXKEqIuF0wKVHDgAAMIFTBo4CDlDg4QM7A4jcoWaitQhSYIhBDBAoYMGjZwqAKVkggbW/B8aks4liJZAO7i1dvBw6WoL3B0weOpcNtWsgbkZezBw4mosFjs8HKnk+W2ARBw6MDawwcQJl5BfWSix5c7nE6zHaCgs2sQIUSIGBRL1REUQMLc2aQ7asoP0IGPGEFCBRYeJ1QEEWOHefNYDRz+gAAugnoJEyZOoECxYsgY3N9jTXgQXASJ8ydOpNifogWRMniY9p0HD5AwXQklrIcCCwyu4EIRZuRR2XciPHCCeSagoIIKLbTgggswHHGGHk9R+EAKJiDI4QsvwODiCzIkgQYfocRX4Qor9MciizHEAMMLMyihRh+j2AgBgx6+CEOPPdKwxBp+kGJkhx+6yKQMWNrQBBt/lBJfBgz4sEcNS2I5w5lnaskGIKbEJ8ECcMTyhpk01FlnDTc00YYgp8S3QAJ5xOLIDDTUUIMNiCJ6AxNtEJJKfAoQsEYslRxqww2YZpoDo4asEt8AAwShSiGY4pDDqajusEQbiLASHwCEAAABhRCn6mDrrTrwsAQbirTyXSgCrVCHFkkI4UMPPCSbbA+7LuLKd0QMtEAUi/jBxhZPGBHEDz74sCsjslnGihkRGCQAC3BkIokgcYhBxRJUxBFJYa/4UYNEEwVgQRSDhIIJI4lkEm4srCAyRQYDnGQQAApwMEQZYPiQQUkKV2yxLAEBADs=',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6uTk5OPj4+Li4uDg4N/f393d3dzc3NjY2NbW1tXV1dHR0dDQ0M7OzszMzMXFxcLCwr+/v729vbu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traurq6enp6ampqWlpaSkpKGhoZ+fn56enp2dnZeXl5aWlpWVlZOTk5CQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fnt7e3h4eHd3d3V1dXR0dHNzc3FxcWxsbGtra2pqamlpaWVlZWRkZGJiYmFhYWBgYF9fX15eXlxcXFVVVVRUVFJSUk5OTktLS0pKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozo6Ojk5OTg4ODU1NTQ0NDIyMjExMTAwMC4uLi0tLSkpKSgoKCYmJiUlJSQkJCMjIyIiIiAgIB0dHRwcHBoaGhkZGRcXFxUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJIALAAAAAAgACAAAAj+ACUJHAggwQMJFS5csMCwocIKEiIkEDCwYkUOCgBo3MhxYwYjUXA4MKDBYsUIFwJ0XKmRTKSXhCY0kGBSYIiMLFc+UKKGjpYFAz7ULBCCQM6jGwNkIGCyAwYBSKM+4GDyBIQAWLOqjLrRQAiLBE4c4Io06ICKGjoY1TiAbMcAFjBUJGFBQIAcdyAdarKVbIAIXweyiBDAx8vDH9xqTDBiYIAVCgKgORzpUATFAAqIACBQQggDAUQIetnGQ1StKgdwgCCQA4cCWAlgkGA3a07UAQRQKCkpxIYIEIJDcNCgAfHiDhw8eBC8AYMECA4YOLCgAgiBOGiUMHHiBIoUKVTZqFhBngWLFuhbsFiR4kQJEiNGqHghsEiXKU+aLEFipAiRIUIEGMSAAwpBRBFHJKEEE05AcQUP2CUSyB997JGHHXTIAccbbrjRRhtshNhGHHPUgYcefPwBiCEwCAQCZTBCIuOMj9QICYyUddAZjjz2yGMDAxHi45A8AlKRS0Qm+RIYFeGgpJI4VJTBk0nKRRAgVPoICGcVSZFlj1OY5MGXPF5nEQB1kEmZHgHURIOah+VQkyQLJALnIg/MKQkIbthJZSN0iKBnRQEsMMEFHiSqaKIXTLAAUzUFBAA7'
  },
  die3: {
    die: 'data:image/gif;base64,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',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn52dnZycnJubm5mZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIqKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGZmZmRkZGNjY2JiYmFhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFdXV1ZWVlVVVVNTU1JSUlFRUVBQUE9PT01NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUNDQ0FBQUBAQDw8PDo6Ojc3NzY2NjU1NTQ0NDIyMjExMTAwMC4uLi0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIALUALAAAAAAgACAAAAj+AGsJHEiwoMGDCBESWNAAwocNDQgknFgLAYMFBAAIEMDhCZ47bLQA+aAAAMVaChggADDAgIIGEjo4qcNpValNkhLp+TJjwUEADBQEIKDAwYQLGjp8iHFFzyhaUGnNenUq0yIvF0wKVHDgAAMIFTBo4DAlDw4QM7I4jcoWKqxRiCYIhBDBAoYMGjZwsAL1kggbXPSIakuYVqNaAO5qyMuhgwdNUV/g8KInVOG2sGoNyKvXsYcTUWex2PElD6jLbQMgaNzB8QcQJmRBlWSiB5g8n1CzHaDAwwffIEKIEGGIVqsjKICIyeNJd9SUr0EEHzGChIosPE6oCDIGT3PntBr+OJAuvHoJEyZOnECxYggZ3OBpTXhQnsSSJ+pR6E/RgogZPaeB58EDJJRQghCyzLJECgyqsIILRZyxh2XgifAAeibQARUfDq6wAgswHIEGH09V+AAKDAoClSIssNDCizEkkYYfpMRnoQo4ygGVHi70+MILMyixxh+m2AjBhywI4QosR7wAw5Mw0MAEG4CcYuSLPRJxRAxcxiCDDDY40UYgqMSXAQM+9FEDDF7KMMObb94g5iCpxCfBAnHQAseXM9DgZw2A4uCEG4WoEt8CCexBSyR9AmrDozfckEMTbhzCSnwKEMAGLZjUAOkNOISagw6UJuJKfAMMEEQriESKQw6RsOog6w5MuLHIK/EBAAAQUQgRqw47BLsDDzww0UYjsIBHikAr3LFFEkL40AOxPPRgrbGOxAIeEQMtIIUjgLTBBRRGCPGDDz4Y+4hsl71yRgQGCcBCHJxUUogcY1TBRBVyUFKYLIDUINFEAVgghSGkbPIII5ywS8sri1CRwQAnGQSAAhwMYUYYPmRQUsUgh1xLQAA7',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6uTk5OPj4+Li4uDg4N/f393d3dzc3NnZ2djY2NbW1tXV1dHR0dDQ0M7Ozs3NzczMzMXFxcLCwr+/v729vbu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traurq6enp6ampqWlpaSkpKGhoZ+fn56enp2dnZeXl5aWlpWVlZOTk5CQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fnt7e3h4eHd3d3V1dXR0dHNzc3FxcXBwcGxsbGtra2pqamlpaWVlZWRkZGJiYmFhYWBgYF9fX15eXlxcXFVVVVRUVFJSUk5OTkxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozo6Ojk5OTg4ODU1NTQ0NDIyMjExMTAwMC4uLi0tLSkpKSgoKCYmJiUlJSQkJCMjIyIiIiAgIB0dHRwcHBoaGhkZGRcXFxUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJYALAAAAAAgACAAAAj+AC0JHAggwQMJFS5csMCwocIKEiIkEDCwYsUOCgBo3MhxYwYkU3Q4MLDBYsUIFwJ0XKnxTKWXiCY0kGBS4IiMLFc+YOIGT5cFA0DULDCCQM4QQ5TAKMAygAYCJj1gEMASyMuXb1Tq7GAyBQStHbtcrYTI6EoDIywSSHEgZ4Ijbehw0ZBzQIgBFTd4MAtgQM6/AAJYwFDRhAUBAXbsobToCVjAGgNESDvQRYQAVseCgNwxQYmBAVooCLBm7KIInDkWIAFAoIQRBgKQMPQyzofUHAd0gCCwQ4cCAQIQwCABcfDHHI8fF0ChpKURHCJAmA7BQYMG1q87cPDgwfQGDBLvIDhg4MCCCiIE6rBxAkWKFCpWrGDBooV9Fy5e6H/hosWKFCeYUEIJLMQg0BFgVBHFE00ogcQRRhRBxIRDVFghEUYckcQSTDgBhRRZ+KBeI4UMEsgffeiBhx10zCGHHHHEAceMcdRxRx58+AHIIIQoIoNAIowlJCVEFjnJkZQIOZYHrinp5JNONjAQIlBW6SQhFblk5ZYvjVGRDlxyqUNFGYS5JWEEEWImlIS0VhEVaz5ZhUkfxOlkehYBkIedY/kRQE028HnVDjVZskAjgj7yQKGWiCAHomZGggcJjFYUwAITXPDBppxuesEEC0BVU0AAOw=='
  },
  die4: {
    die: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPz8/Pv7+/r6+vn5+fj4+Pf39/b29vT09PLy8vDw8O/v7+7u7u3t7erq6ubm5t7e3tbW1tXV1c7Ozs3NzczMzMjIyMfHx8bGxsXFxcTExMPDw8DAwLy8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5WVlZSUlJOTk5GRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3h4eHZ2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGJiYmBgYF5eXl1dXVlZWVVVVVJSUlFRUVBQUExMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozk5OTg4ODc3NzU1NTQ0NC8vLy4uLiwsLCoqKicnJyIiIiEhISAgIB8fHxkZGRgYGBYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJ8ALAAAAAAgACAAAAj+AD8JHEiwoMGDCBEaQMCwoYGEBg88mPjAQQMFBQIA2MgRQIEEDRxQfPCQoAEKDRgsUIDggAECAwJo7AgggIABBAwYSBBhAEEKLjZoGEo0QwYMGC5YWLq0QoWlFy5kECGB4AYdIj58MBIGiQcPHcKG5UCWbI0uU0Jw8NBiBEETOkiEqOOpbh2teL/qnbKp7iMVH1y4HbhDRwkldRMLAcG4cWNKiT3JAeGiBMEgO0yYiewpi4jPoEOEQMH5kIgXMAgm2YECSt1OnTjpGEG7du1HsOvOGfEiCEEsPFKcwOMp9pkSyJMnJ1HkUidPkWSQgBGFIBceKlCgQLLFx4kTJsL+ix//wooUFSVMwHhCsEwPFiniy9euPQV9+idQfP8ewwlBMz+0sMKAA6pgoAoErnDggivENwN7A50BxAstVMjChRdW2AKGHGbIwgo1VDcQGkHA8IILKKLYggsvnJjiiyy22MINUhCUhhAywKCjiS3uqGOLQPoIgws4TEGQGkPQIMOSMTQZw5JQOinlkzHAoAMVBK1BRA0z0DDDl1B2+eWYMowJpgw8VEEQG0XcUMObNMQp55twyinnlzT0gEV7R+Bgw5870Ennn4Ta8OYNhtJQww8iCuRFEjrgAAYlnUACxQ2YZqopEIBokgkdmAaRBEFULMFDE5wU18klQOTg6qvWrwaSmydt4CDEEAQx0UQPb7wG2xc6BCusDjv0sMmsiuhAhA4EDQHFD2eoCtt1PFRrLQ8+YDJrIDsUkdpAOEgRxBCTwNaJJEH4oO6669phriZX9GAECwS9QIUQQCiBhyN5KAHEvwAHHEQcjAyChQ8/IPGBVWZI8YQTTTDBxBJKJGFxEkpkrPHGSjSxRQUEDfCGI4wocgghgfihBx556LEHH3348ccfgAgyCCGFGLLIGgEUBAAFKNCAhBVhzMEHI0gnjTQfc5CRRRI2sEABABBVbfXVWB8UEAA7',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn52dnZycnJubm5qampmZmZiYmJeXl5aWlpWVlZSUlJOTk5GRkZCQkI+Pj46Ojo2NjYyMjIqKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGZmZmRkZGNjY2JiYmFhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFdXV1ZWVlVVVVNTU1JSUlFRUVBQUE9PT01NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUNDQ0FBQUBAQDw8PDo6Ojc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC4uLi0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIALYALAAAAAAgACAAAAj+AG0JHEiwoMGDCBESWNAAwocNDQgknGgLAYMFBAAIEMDhCZ47bLQA+aAAAEVbChggADDAgIIGEjo4qdOJlSlOkhLp+TJjwUEADBQEIKDAwYQLGjp8iHFFD6laUGvRgoVK0yIvF0wKVHDgAAMIFTBo4DAlDw4QM7I4jcoWaixSiCYIhBDBAoYMGjZwsAIVkwgbXPSMaku4ViNbADCoUZKXQwcPm6K+wOFFj6jCbWPZGvCj1iPHHjyciEqLxY4veUJhbhsAwZpakx5/AGFiFlRJJnqAyQNqNdsBCujUEjQ7hAgRhmq5QoICiJg8n3xHTcml1hIQIUaMIKEiC48TKoL+jMETXXqtBg5CADG+vYQJEydOoFgxhAxv87UmPMi+/X18FACm0EIRZuihmnkePOCefCk06KAKKrhgxBl7XGaeCA80COGGKqzgIQswIIEGH09d+AALKKaYYgssxqBEGn6Ugp8IELBoI4su5PjCCzMsscYfp8xYYws67vgCDEjGQAMTbACCipA4upBkDFTKIIMNTrQRSCr4ZcCAD33UAEMMVs5gppk3ZDmIKvhJsEActcBRJg00VHEJIDng4IQbhayC3wIJ7FFLJDPQUEMNNpS3Bw5NuHFIK/gpQAAbtWSCqA039BAVKzs0msgr+A0wQBCuIHLDDTjkoIMrUR3BhBuMi8CCHwAAABGFEDmoqoMOi7gFBBNtNBKLeaUItMIdWyghhA898JCEJ7T00QOwjshiXhEDLSCFI4C0wQUURxDRhA8+APuIbZjBckYEBgnAQhydVFKIHGNUwUQVclBS2CyA1CDRRAFYIIUhpXDyCCOdoFsLLItQkcEAJxkEgAIcDGFGGD5kUFLEHHdsS0AAOw==',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6uTk5OPj4+Li4uDg4N/f393d3dzc3Nra2tjY2NbW1tXV1dHR0dDQ0M7OzszMzMXFxcLCwr+/v729vbu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traurq6enp6ampqWlpaSkpKGhoZ+fn56enp2dnZmZmZeXl5aWlpWVlZOTk5CQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fnx8fHt7e3h4eHd3d3V1dXR0dHNzc3FxcW9vb2xsbGtra2pqamlpaWVlZWRkZGJiYmFhYWBgYF9fX15eXl1dXVxcXFhYWFVVVVRUVFJSUk5OTk1NTUtLS0pKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozo6Ojk5OTg4ODU1NTQ0NDIyMjExMTAwMC4uLi0tLSsrKykpKSgoKCYmJiUlJSQkJCMjIyIiIiAgIB0dHRwcHBoaGhkZGRcXFxUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJoALAAAAAAgACAAAAj+ADUJHAggwQMJFS5csMCwocIKEiIkEDCwYsUOCgakcDJFBYCPID9mQDIlhwMDGyxWjHAhwJpMMCclCAkSDcxMjCY0kKBSoAgFAHzUwdPFA02QD5jE2eNlwQAQPQuIIHC0atUAGgio9IBBgNWvIR90UIkCQgCwaA2IsEgAxQG0V88CeDqg4gYPVD8OgHs0gAUMFUtYEBBAhx9Mj57IrUriMKIqCwJEWDuwRYQAQG7CBPGVkGY4BUkMDMBCQQA3mh9F+JpGcyYFBUYAEChBhIEAIxTBpPMBLAMwlTJVajK3AwSBHToUCBCAAAYJhJkvphkggQYGzAVQSKlJBIcIEML+Q3DQoAH58g4cPHgQvgGDBAgOGDiwoEIIgTlqmDiBAkUKFSqssAILBLbQggsIutACCyqgYEIJJJCwAgwCHRGGFVE80YQSSBxhRBFEhDjEiCMSYcQRSSzBhBNQSKGFD/hFkoghhAgCSB975HGHHXXUQQcdcwRJBx568PFHIIMYcogjMQgUgmuaYSLllJdUiQmUN3lAG5ZcdqlZAwMx4uWYriFSkU1kpklGRTmkmWYOFWXgJpmAEXTInF0eMltFVODJZRUqfeAnlvdZBAAfg2oWSAA91ZDoTTr0pMkCkTw6yQOSahJCHZXOWckeI2RaUQALTHDBB6imiuoFEyygVU8CAQEAOw=='
  },
  die5: {
    die: 'data:image/gif;base64,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',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn52dnZycnJubm5qampmZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIqKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGZmZmRkZGNjY2JiYmFhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFdXV1ZWVlVVVVNTU1JSUlFRUVBQUE9PT01NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUNDQ0FBQUBAQDw8PDo6Ojc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC4uLi0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIALcALAAAAAAgACAAAAj+AG8JHEiwoMGDCBESWNAAwocNDQgknHgLAYMFBAAIEMABSh48bbYA+aAAAMVbChggADDAgIIGEjo8seOp1alOkxTtATNjwUEADBQEIKDAwYQLGjp8iIFlTylbUG3VipVqE6MvF0wKVHDgAAMIFTBo4EBFDw4QM7Q4jcoWqqxSiSYIhBDBAoYMGjZwuAI1kwgbXfaQakvYlqNbADCsUZKXQwcPnKK+wPFlz6jCbWXdGvDDFiTHHjyciFqLxQ4wekRhbhsAARtblB5/AGGCFtRJJnqE0RNqNdsBCurYGjQ7hAgRh2y9QoICyBg9oHxHTdnF1hIQIUaMIKFCC48TKoL+kMkTXbqtBg5CADG+vYQJEydOoFgxpAxv87YmPGBPggmU+PKhkEILRZyxh2rmefAACSWUIAQttTCRwoQpqOCCEWjwcZl5IjzwngnC2dKHCiuUuAIMSKTRx1McPoDCi4NAtQgLNLbQQgxKqPGHKfh1qMKPc0C1hwtEuvDCDEuwAQgqPUJAIwtCwCILEi/AYCUMNDTRRiCpNGkjkUUgEcOYMcgggw1PuCGIKvhlwIAPftQAQ5kyzGCnnTekScgq+EmwgBy2xGHmDDTQYAUmgeSAwxNvGMIKfgskwIctkhBaQw02lMcHDk68gYgr+ClAQBu2aIKpDTf0EFUrO3SqCCyg+A0wQBCvJHLDDTjkoMMrUR3RxBuMxIIfAAAAIYUQOeiqgw6MuAVEE244Iot5pgi0Ah5cKCGEDz3wkMQntfjRA7SPzGJeEQMtMMUjgbjRRRRHEOGEDz5AC4ltmMWCRgQGCcCCHJ5YYsgcZFjRhBVzVFIYLYHUINFEAVgwxSGmdAJJI57ga0ssjFSRwQAnGQSAAhwMcYYYPmRQUsgst3xLQAA7',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6uTk5OPj4+Li4uDg4N/f393d3dzc3Nra2tnZ2djY2NbW1tXV1dHR0dDQ0M7Ozs3NzczMzMXFxcLCwr+/v729vbu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traurq6enp6ampqWlpaSkpKGhoZ+fn56enp2dnZmZmZeXl5aWlpWVlZOTk5CQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fnx8fHt7e3h4eHd3d3V1dXR0dHNzc3FxcXBwcG9vb2xsbGtra2pqamlpaWVlZWRkZGJiYmFhYWBgYF9fX15eXl1dXVxcXFhYWFVVVVRUVFJSUk5OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozo6Ojk5OTg4ODU1NTQ0NDIyMjExMTAwMC4uLi0tLSsrKykpKSgoKCYmJiUlJSQkJCMjIyIiIiAgIB0dHRwcHBoaGhkZGRcXFxUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAJ4ALAAAAAAgACAAAAj+AD0JHAggwQMJFS5csMCwocIKEiIkEDCwYkUPCgasgFKFBYCPID9mUFJlhwMDHCxWjHAhgJtOMC8lCAlyDcxOkCY0kKBSIAkFAIDk4QPmA02QD5zU+RNmwYAQPQuQIHD0o4giTGIUqBpAAwGVHzAIqCrkZic7Aao+8KBSBYS0R8OYhUT1qAESFgmoOFC1YBI6e75s6DtAxICKHD7UBTCgr2MAASxgqHjCgoAAPARxmhQFblUTmhldWRAgAt6BLyIEKGs2hGNEZucUNDEwgAsFAeKYnRTBMRuznRQUKAFAoAQSBgKUcAQTD4jHDMZk6pTpCWMPEAR68FAgQAACGCT+XPbumWaABBoYeBdAIaUnEh0iQJgPwUGDBvbvO3Dw4MH8BgwkgMABBhywQAUjCLTDDSikoIIKK7DAQgstuGDhCy/AoCEML7jAggoonGCCCS3IIFASZGAxRRRPMKFEEkgcYcSMRdRYoxFIJLFEE05AIQUVXAChYCWNKIKIIYQE8kcfe+iRRx544HHHlHjw4QcggxRyiCKLSDKDQCMAZxYnZJa5yZmciHnTB8ap6eabZjUwECRw1gkcIxXZZOeeZ1S0w5577lBRBoDaORlBixT65iLFVWSFom5eoRIIkKqZoEUAAFKpWYUE0NMNm97EQ0+eLFBJqJc8QKonI+RxaqEYmfxRwqoVBbDABBeAoOuuul4wwQJf9RQQADs='
  },
  die6: {
    die: 'data:image/gif;base64,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',
    side: 'data:image/gif;base64,R0lGODlhIAAgAPcAAPn5+ff39/X19fT09O7u7u3t7ezs7Ovr6+rq6ujo6OPj49/f393d3dnZ2djY2NbW1tLS0tHR0dDQ0M/Pz83NzcvLy8rKysnJycfHx8bGxsXFxcTExMPDw8LCwsHBwcDAwL+/v76+vr29vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqqmpqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIqKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXt7e3p6enl5eXh4eHd3d3Z2dnV1dXNzc3JycnFxcXBwcG9vb25ubmxsbGtra2pqamhoaGZmZmRkZGNjY2JiYmFhYV9fX15eXl1dXVxcXFtbW1lZWVhYWFdXV1ZWVlVVVVNTU1JSUlFRUVBQUE9PT05OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0FBQUBAQDw8PDo6Ojk5OTg4ODc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC4uLi0tLSsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIALwALAAAAAAgACAAAAj+AHkJHEiwoMGDCBESWNAAwocNDQgknMgLAYMFBAAIEMAhip48brgA+aAAAEVeChggADDAgIIGEjpAuTNKFitRlhjxCTNjwUEADBQEIKDAwYQLGjp8iJGFj6pdUHfpsuUKlCMwF0wKVHDgAAMIFTBo4FBlDw4QM7Y4jcoW6i1ViyYIhBDBAoYMGjZwwALVkwgbXvikakt4VyReADCwWZKXQwcPoaK+wAGGD6rCbW/xGvBj1yTHHjyciKqLxY4we05hbhsAQZtdmR5/AGEiF1RLJnqI2WNqNdsBCuzsIjQ7hAgRiXbRSoICCJk9pXxHTellFxMQIUaMIKFiC48TKoT+lNETXfquBg5CADG+vYQJEydOoFhBxAxv87smPBABZESJ+PEpgYkiMrRgBBp8qGaeBw+QsQsUKKQgIQuD7fKHC0ek0cdl5onwQCS77LHCiCo8EZUqMCShhh9PdfjAJbsM0kILLLCgRVSyxLDEGoCsgp+HhuwihwtEuhBEVJrMwEQbgbTyIwRLbMLDCzDA8MILh0jFBQ1OuCGIK0/O6AKVMMQQwwxeNCGDDVC8Mcgr+GXAgA9/1FCmDDLMoKeeN7RZCCz4SbDAHELiOQMNNFzRiSA54AAFHIjEgt8CCfSxSyWH1lCDDeX1gcMTcCgyC34KEODGLp9sasMNPeC4A6ijjNSC3wADCEHLIjfcgEMOOtASFRJOwOGILfgBAAAQUwyRA6866OCIW0A48QYkt5i3ikAr5NHFEkP40AMPSpCiyx89SCsJLuYZMdACVEgiyBteSIFEEU/44IO0k9iGmS1pRGCQACzMMcomiNBRxhVOXEGHJoXlIkgNEk0UgAVUJLKKKJM8Moq+u9jiiBUZDHCSQQAowAERaIzhQwYljezyy7wEBAA7',
    top: 'data:image/gif;base64,R0lGODlhIAAgAPcAAP39/fz8/Pv7+/r6+vn5+fj4+Pb29vX19fT09PPz8/Ly8vHx8fDw8O/v7+7u7u3t7ezs7Ovr6+rq6ufn5+Tk5OPj4+Li4uDg4N/f393d3dzc3Nra2tjY2NbW1tXV1dHR0dDQ0M7OzszMzMbGxsXFxcTExMLCwsHBwb+/v729vby8vLu7u7q6urm5ubi4uLe3t7a2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traurq6enp6ampqWlpaSkpKGhoZ+fn56enp2dnZmZmZeXl5aWlpWVlZOTk5CQkI+Pj46Ojo2NjYuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXx8fHt7e3h4eHd3d3V1dXR0dHNzc3FxcW9vb2xsbGtra2pqamlpaWVlZWRkZGJiYmFhYWBgYF9fX15eXl1dXVxcXFhYWFVVVVRUVFJSUk5OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRUREREJCQkFBQT4+Pj09PTs7Ozo6Ojk5OTg4ODY2NjU1NTQ0NDIyMjExMTAwMC8vLy4uLi0tLSsrKykpKSgoKCYmJiUlJSQkJCMjIyIiIiAgIB0dHRwcHBoaGhkZGRcXFxYWFhUVFRQUFBMTExISEv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAnIAKQALAAAAAAgACAAAAj+AEkJHAggwQMJFjBguMCwoUILEyIkEDCwYkUPCga4mILlBYCPID9qaILFhwMDHCxWjIAhQJxRMDklCAnSDcxRlSg0mKBS4AgFAIbw+TPmA02QD6LgEURmwYAQPQuQIAAAgYoeJQIcBYlBx4wJAAJsIKDSQwYBKyrd9LIVwAlQMD9VAfDAg8oWEAIQujlKS9sRcG9uMEDCIoEWBwC44OPoDpABbQGQcNMIERUBTwdU5PCB6kfIkdsGuJChYooLAgL8KCQKExWtbVGwjrRlQYAIIyrKiBCgCN9RISIz4munIIqBAWIoCECHL6YIkd/8VlCgBACBEkgYCGBiEsw9IEL+MzDjaZQnKQAGeIAg0IOHAgECEMggIXV82EcDJNjAIL6ACimRUkIHEUBgIAQONNBAggo64MADDxjYAAMJIHCAAQcsYIEIAvmgwwostNCCCy+8AAMMMaQogwwztDiDDDG80MIKKaCAAgw1CMTEGVxYQYUUTzTBxBJKJGEkEkgimcQSTDgBRRRTVHEFGEN0qIkkjzCiyCGECAKIH33wwccee+hh5h5/BDKIIYks8ggkl9ggkAi/8SXKnXiGoqcodd70AXZ9BiooXw0MpNagiPIVSUU2JeqoGhX54KijPlSkwaSJlkYQJJgKCsl1FWnRaaBbqATCqH1yaBEAg6DKFyIwAfSkg6s3/dATKQtoQisnD9xKigh86IqpJ4KY4GtFASwwAQYgNOtssxhQsABZPQUEADs='
  }
};

},{}],7:[function(require,module,exports){
'use strict';

var ko = require('knockout'),
    images = require('./d6-images');

function DieModel() {
  this.showImg = this.showImg.bind(this);

  this.imageSrc = ko.observable('');

  this.seedMod = Math.round(Math.random() * 100);
  this.seedModInc = Math.round(Math.random() * 100) + 89;
  this.initSeed();
  this.callback = function() {
    return false;
  };
  this.interval = 50;
}

DieModel.prototype.start = function(result, callback) {
  var sequence = [],
      seqCount = this.random(6) + this.random(6) + this.random(6) + 4,
      thisRoll = 0,
      i;

  this.callback = callback;

  for (i = 0; i <= seqCount; i++) {
    thisRoll += this.randomBaseOne(5);
    thisRoll = thisRoll % 6;
    if (!thisRoll) {
      thisRoll = 6;
    }
    sequence.push(thisRoll);
  }

  sequence.push(result);
  this.result = result;
  this.animate(sequence);
};

DieModel.prototype.animate = function(sequence) {
  var numNumbers = sequence.length,
      state = 'die',
      seq,
      nextCall;

  if (numNumbers % 2 === 0) {
    state = this.random(2) === 0 ? 'side' : 'top';
  }
  this.showImg(sequence[0], state);
  if (state === 'die') {
    if (numNumbers === 1) {
      setTimeout(this.callback, this.interval);
      return true;
    }
  }
  if (sequence.length > 1) {
    seq = sequence.slice(1);
    nextCall = function() {
      return this.animate(seq);
    }.bind(this);
    setTimeout(nextCall, this.interval);
  }
};

DieModel.prototype.showImg = function(number, state) {
  if (number < 1 || number > 6 || !state) {
    this.imageSrc(images.blank);
    return;
  }

  var whichDie = 'die' + number,
      dieObj = images[whichDie],
      dieImg = dieObj[state];

  this.imageSrc(dieImg);
};

DieModel.prototype.clear = function() {
  this.showImg(0, false);
  return this;
};

DieModel.prototype.randomBaseOne = function(n) {
  var m = this.random(n);
  return m + 1;
};

DieModel.prototype.random = function(n) {
  if (!this.seed) {
    this.reInitSeed();
  }
  this.seed = (0x015a4e35 * this.seed) % 0x7fffffff;
  return (this.seed >> 16) % n;
};

DieModel.prototype.initSeed = function() {
  var now = new Date();
  this.seed = (this.seedMod + now.getTime()) % 0xffffffff;
};

DieModel.prototype.reInitSeed = function() {
  this.seedMod += this.seedModInc;
  this.initSeed();
};

module.exports = DieModel;

},{"./d6-images":6,"knockout":undefined}],8:[function(require,module,exports){
module.exports = "<div>\n  <button type=\"button\"\n          class=\"btn btn-default btn-block\"\n          data-bind=\"\n          click: toggleNotifications,\n          text: notificationsText\n          visible: notifications.isSupported\n          \"\n          >\n  </button>\n\n  <button type=\"button\"\n          class=\"btn btn-default btn-block\"\n          data-bind=\"click: toggleFullscreen, visible: fullScreen\"\n          >\n    Toggle full screen\n  </button>\n\n  <a href=\"/lobby\" class=\"btn btn-default btn-block\">Back to lobby</a>\n</div>\n";

},{}],9:[function(require,module,exports){
'use strict';

var ko = require('knockout'),
    screenfull = require('screenfull'),
    template = require('./menu.html');

function MenuModel(params) {
  var notificationsEnabled = ko.observable(params.notifications.isEnabled);

  this.toggleNotifications = this.toggleNotifications.bind(this);
  this.toggleFullscreen = this.toggleFullscreen.bind(this);
  this.notifications = params.notifications;

  this.notificationsEnabled = notificationsEnabled;
  this.notificationsText = ko.computed(function() {
    if (notificationsEnabled()) {
      return 'Disable Notifications';
    } else {
      return 'Enable Notifications';
    }
  });

  this.fullScreen = screenfull.enabled;
}

MenuModel.prototype.toggleFullscreen = function() {
  screenfull.toggle();
};

MenuModel.prototype.toggleNotifications = function() {
  this.notifications.toggle(function(enabled) {
    return this.notificationsEnabled(enabled);
  }.bind(this));
};

module.exports = {
  viewModel: MenuModel,
  template: template
};

},{"./menu.html":8,"knockout":undefined,"screenfull":undefined}],10:[function(require,module,exports){
module.exports = "<div class=\"container-fluid this-user\" data-bind=\"visible: !isPlayer\">\n  <div class=\"row\">\n    <div class=\"col-xs-9\">\n      <p>You are spectating this game.</p>\n    </div>\n\n    <div class=\"col-xs-3 visible-xs mobile-controls\" style=\"padding-left: 0\">\n      <div class=\"btn-toolbar pull-right\" role=\"toolbar\">\n\n        <div class=\"btn-group\">\n          <button type=\"button\" class=\"btn btn-default sidebar-toggle\" data-toggle=\"offcanvas\" data-target=\".sidebar\">\n            <span class=\"icon-bar\"></span>\n            <span class=\"icon-bar\"></span>\n            <span class=\"icon-bar\"></span>\n          </button>\n        </div>\n\n      </div>\n    </div>\n  </div>\n</div>\n\n<div class=\"container-fluid this-user player\" data-bind=\"visible: isPlayer\">\n  <div class=\"row\">\n    <div class=\"col-sm-3 col-md-2 col-lg-4 hidden-xs\">\n      <div class=\"row\">\n        <div class=\"col-xs-12 name\">\n          <img class=\"avatar\"\n            data-bind=\"attr: { src: user.avatarUrl }\" />\n          <span data-bind=\"text: user.name\"></span>\n          <span class=\"icon-star\"\n            data-bind=\"text: player.victoryPoints.actual\"></span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"col-xs-9 col-sm-3 col-md-5 col-lg-4\" style=\"padding-right: 0\">\n      <div class=\"row hidden-sm hidden-md hidden-lg\">\n        <div class=\"col-xs-12 name\">\n          <span data-bind=\"text: user.name\"></span>\n          <span class=\"icon-star\"\n            data-bind=\"text: player.victoryPoints.actual\"></span>\n        </div>\n      </div>\n      <div class=\"row badges\">\n        <div class=\"col-xs-12\">\n          <span class=\"icon-gift\" title=\"Resources\"></span>\n          <span class=\"badge lumber\" title=\"Lumber\">\n            <span data-bind=\"text: player.resources.lumber\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Lumber</span>\n          </span>\n          <span class=\"badge brick\" title=\"Brick\">\n            <span data-bind=\"text: player.resources.brick\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Brick</span>\n          </span>\n          <span class=\"badge wool\" title=\"Wool\">\n            <span data-bind=\"text: player.resources.wool\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Wool</span>\n          </span>\n          <span class=\"badge grain\" title=\"Grain\">\n            <span data-bind=\"text: player.resources.grain\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Grain</span>\n          </span>\n          <span class=\"badge ore\" title=\"Ore\">\n            <span data-bind=\"text: player.resources.ore\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Ore</span>\n          </span>\n        </div>\n      </div>\n\n      <div class=\"row badges\">\n        <div class=\"col-xs-12\">\n          <span class=\"icon-hammer\" title=\"Development Cards\"></span>\n          <span class=\"badge\" title=\"Development Cards\">\n            <span data-bind=\"text: player.developmentCards.total\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Dev Cards</span>\n          </span>\n\n          &nbsp;\n\n          <span class=\"icon-shield\" title=\"Largest Army\"></span>\n          <span class=\"badge\" title=\"Largest Army\">\n            <span data-bind=\"text: player.knightsPlayed\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Army</span>\n          </span>\n\n          &nbsp;\n\n          <span class=\"icon-road\" title=\"Longest Road\"></span>\n          <span class=\"badge\" title=\"Longest Road\">\n            <span data-bind=\"text: player.longestRoad\"></span>\n            <span class=\"hidden-xs hidden-sm\">- Longest Road</span>\n          </span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"col-sm-6 col-md-5 col-lg-4 hidden-xs controls\">\n      <div class=\"pull-right\">\n        <button type=\"button\" class=\"btn btn-default navbar-btn\" data-bind=\"enable: $root.ui.buttons\" data-toggle=\"modal\" data-target=\"#buildModal\">Build</button>\n        <button type=\"button\" class=\"btn btn-default navbar-btn\" data-bind=\"enable: $root.ui.buttons\" data-toggle=\"modal\" data-target=\"#tradeModal\">Trade</button>\n        <button type=\"button\" class=\"btn btn-default navbar-btn\" data-bind=\"enable: $root.ui.buttons\">Dev Cards</button>\n        <button type=\"button\" class=\"btn btn-default navbar-btn\" data-bind=\"enable: $root.ui.buttons, click: actions.endTurn\">End Turn</button>\n      </div>\n    </div>\n\n    <div class=\"col-xs-3 visible-xs mobile-controls\" style=\"padding-left: 0\">\n      <div class=\"btn-toolbar pull-right\" role=\"toolbar\">\n        <div class=\"btn-group-vertical\">\n\n          <div class=\"btn-group dropup\">\n\n            <button type=\"button\" class=\"btn btn-success dropdown-toggle\" data-toggle=\"dropdown\" data-bind=\"enable: $root.ui.buttons\">\n              <span class=\"caret\"></span>\n              <span class=\"sr-only\">Toggle Dropdown</span>\n            </button>\n\n            <ul class=\"dropdown-menu dropdown-menu-right\" role=\"menu\">\n              <li><a href=\"#\" data-toggle=\"modal\" data-target=\"#buildModal\">Build</a></li>\n              <li><a href=\"#\" data-toggle=\"modal\" data-target=\"#tradeModal\">Trade</a></li>\n              <li><a href=\"#\">Dev Cards</a></li>\n              <li class=\"divider\"></li>\n              <li><a data-bind=\"enable: $root.ui.endTurnButton, click: $root.events.onEndTurnClick\">End Turn</a></li>\n            </ul>\n\n          </div>\n\n          <div class=\"btn-group\">\n            <button type=\"button\" class=\"btn btn-default sidebar-toggle\" data-toggle=\"offcanvas\" data-target=\".sidebar\">\n              <span class=\"icon-bar\"></span>\n              <span class=\"icon-bar\"></span>\n              <span class=\"icon-bar\"></span>\n            </button>\n          </div>\n\n        </div>\n\n      </div>\n    </div>\n  </div>\n</div>\n";

},{}],11:[function(require,module,exports){
'use strict';

var template = require('./player.html'),
    observableProps = require('./../game/observable-properties');

function PlayerModel(roomModel) {
  this.roomModel = roomModel;
  this.actions = roomModel.actions;

  observableProps.defineProperties(this, {
    player: this.getPlayer,
    user: this.getUser,
    isPlayer: this.isPlayer
  });
}

PlayerModel.prototype.isPlayer = function() {
  return typeof this.roomModel.thisPlayer === 'object';
};

PlayerModel.prototype.getPlayer = function() {
  return this.roomModel.thisPlayerOrEmpty.player;
};

PlayerModel.prototype.getUser = function() {
  return this.roomModel.thisPlayerOrEmpty.user;
};

module.exports = {
  viewModel: PlayerModel,
  template: template
};

},{"./../game/observable-properties":25,"./player.html":10}],12:[function(require,module,exports){
module.exports = "<div class=\"players\" data-bind=\"foreach: players\">\n\n  <div class=\"player\">\n    <h4>\n      <img class=\"avatar\" data-bind=\"attr: { src: user.avatarUrl }\" />\n      <span data-bind=\"text: user.name\"></span>\n      <span class=\"icon-star\" data-bind=\"text: player.victoryPoints.public\"></span>\n    </h4>\n    <div class=\"well well-sm\">\n      <div class=\"row\">\n        <div class=\"col-xs-3\" title=\"Resource Cards\">\n          <p>\n            <span class=\"icon-gift\"></span>\n            <span class=\"badge\" data-bind=\"text: player.resources.total\"></span>\n          </p>\n        </div>\n        <div class=\"col-xs-3\" title=\"Development Cards\">\n          <p>\n            <span class=\"icon-hammer\"></span>\n            <span class=\"badge\" data-bind=\"text: player.developmentCards.total\"></span>\n          </p>\n        </div>\n        <div class=\"col-xs-3\" title=\"Knights\">\n          <p>\n            <span class=\"icon-shield\"></span>\n            <span class=\"badge\" data-bind=\"text: player.knightsPlayed\"></span>\n          </p>\n        </div>\n        <div class=\"col-xs-3\" title=\"Longest Road\">\n          <p>\n            <span class=\"icon-road\"></span>\n            <span class=\"badge\" data-bind=\"text: player.longestRoad\"></span>\n          </p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";

},{}],13:[function(require,module,exports){
'use strict';

var template = require('./players.html'),
    observableProps = require('./../game/observable-properties');

function PlayersModel(roomModel) {
  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    players: this.getPlayers
  });
}

PlayersModel.prototype.getPlayers = function() {
  return this.roomModel.otherPlayersOrdered;
};

module.exports = {
  viewModel: PlayersModel,
  template: template
};

},{"./../game/observable-properties":25,"./players.html":12}],14:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Stage = require('./../stage');

ko.bindingHandlers.stageInternal = {
  init: function(element, valueAccessor) {
    var stage = new Stage(element),
        game = valueAccessor()();

    $(element).data('stage', stage);

    if (game) {
      stage.addGame(game);
    }
  },
  update: function(element, valueAccessor) {
    var stage = $(element).data('stage'),
        game = valueAccessor()();

    if (stage) {
      stage.removeGame();
      if (game) {
        stage.addGame(game);
      }
    }
  }
};

module.exports = {
  template: '<div class="canvas-kinetic" data-bind="stageInternal: game"></div>'
};

},{"./../stage":31,"jquery":undefined,"knockout":undefined}],15:[function(require,module,exports){
module.exports = "<div class=\"modal fade\" id=\"tradeModal\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\"><span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span></button>\n        <h4 class=\"modal-title\">Trade</h4>\n      </div>\n      <div class=\"modal-body\">\n\n        <p>Offering a trade to other players.</p>\n\n        <div class=\"row\">\n          <div class=\"col-xs-3\">\n            Want\n          </div>\n          <div class=\"col-xs-6\">\n          </div>\n          <div class=\"col-xs-3\">\n            Give\n          </div>\n        </div>\n\n        <div data-bind=\"foreach: resources\">\n\n          <div class=\"row\" data-bind=\"css: key\">\n            <div class=\"col-xs-3\" data-bind=\"text: want\">\n            </div>\n            <div class=\"col-xs-6\">\n\n              <div class=\"input-group\">\n                <span class=\"input-group-btn\">\n                  <button class=\"btn btn-default\" type=\"button\" data-bind=\"click: wantUp\">&#10094;</button>\n                </span>\n                <input type=\"text\" class=\"form-control\" data-bind=\"value: inventory\">\n                <span class=\"input-group-btn\">\n                  <button class=\"btn btn-default\" type=\"button\" data-bind=\"click: giveUp\">&#10095;</button>\n                </span>\n              </div>\n\n            </div>\n            <div class=\"col-xs-3\" data-bind=\"text: give\">\n            </div>\n          </div>\n\n        </div>\n\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n        <button type=\"button\" class=\"btn btn-primary\"\n          data-bind=\"click: offerTrade\">Offer trade</button>\n      </div>\n    </div>\n  </div>\n</div>\n";

},{}],16:[function(require,module,exports){
'use strict';

var template = require('./trade-modal.html'),
    observableProps = require('./../game/observable-properties');

function ResourceModel(key, player) {
  this.wantUp = this.wantUp.bind(this);
  this.giveUp = this.giveUp.bind(this);

  this.key = key;
  this.player = player;

  observableProps.defineProperties(this, {
    want: 0,
    give: 0,
    resources: this.getResources,
    diff: this.getDiff,
    inventory: this.getInventory
  });
}

ResourceModel.prototype.getResources = function() {
  return this.player.resources[this.key] || 0;
};

ResourceModel.prototype.getDiff = function() {
  return this.want - this.give;
};

ResourceModel.prototype.getInventory = function() {
  return this.resources + this.diff;
};

ResourceModel.prototype.giveUp = function() {
  if (this.want > 0) {
    this.want -= 1;
  } else {
    if (this.inventory > 0) {
      this.give += 1;
    }
  }
};

ResourceModel.prototype.wantUp = function() {
  if (this.give > 0) {
    this.give -= 1;
  } else {
    this.want += 1;
  }
};

function TradeModalModel(roomModel) {
  this.actions = roomModel.actions;
  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    resources: this.getResources
  });

  this.offerTrade = this.offerTrade.bind(this);
}

TradeModalModel.prototype.getResources = function() {
  var resourceKeys = ['lumber', 'brick', 'wool', 'grain', 'ore'],
      thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer && thisPlayer.resources) {
    return resourceKeys.map(function(key) {
      return new ResourceModel(key, thisPlayer);
    });
  }

  return [];
};

TradeModalModel.prototype.offerTrade = function() {
  var resources = this.resources
    .map(function(resource) {
      return {
        resource: resource.key,
        value: resource.diff
      };
    })
    .filter(function(resource) {
      return resource.value !== 0;
    });

  this.actions.offerTrade(resources);
};

module.exports = {
  viewModel: TradeModalModel,
  template: template
};

},{"./../game/observable-properties":25,"./trade-modal.html":15}],17:[function(require,module,exports){
'use strict';

var emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    Board = common.Board;

function UiBoard() {
  this.onStageTransformEnd = this.onStageTransformEnd.bind(this);
  this.onStageTransform = this.onStageTransform.bind(this);
  this.addEdge = this.addEdge.bind(this);
  this.addCorner = this.addCorner.bind(this);
  this.addTile = this.addTile.bind(this);
  this.redraw = this.redraw.bind(this);

  Board.apply(this, arguments);
  emitter(this);

  this.bgGroup = new Kinetic.Group();
  this.fgGroup = new Kinetic.Group();
  this.layer = new Kinetic.Layer({
    rotation: 0,
    draggable: true
  });

  this.layer.add(this.bgGroup);
  this.layer.add(this.fgGroup);
}

common.util.inherits(UiBoard, Board);

UiBoard.prototype.redraw = function() {
  this.layer.batchDraw();
};

UiBoard.prototype.addTile = function(tile) {
  Board.prototype.addTile.call(this, tile);

  if (tile.bgHexagon) {
    this.bgGroup.add(tile.bgHexagon);
  }

  this.fgGroup.add(tile.group);
};

UiBoard.prototype.addCorner = function(corner) {
  Board.prototype.addCorner.call(this, corner);
  this.layer.add(corner.group);
};

UiBoard.prototype.addEdge = function(edge) {
  Board.prototype.addEdge.call(this, edge);
  this.layer.add(edge.group);
};

UiBoard.prototype.onStageTransform = function(transform) {
  var offset;

  if (this.transforming) {
    return;
  }
  this.transforming = true;
  if (transform.center && !this.transformOffset) {
    this.transformOffset = true;
    this.layer.draggable(false);
    offset = this.layer.getAbsoluteTransform().invert().point(transform.center);
    this.layer.position(transform.center);
    this.layer.offset(offset);
  }
  if (transform.center) {
    this.layer.position(transform.center);
  }
  this.layer.scale({
    x: transform.scale,
    y: transform.scale
  });
  this.layer.rotation(transform.rotation);
  this.emit('board:rotate', transform.rotation);
  this.redraw();
  this.transforming = false;
};

UiBoard.prototype.onStageTransformEnd = function() {
  this.transformOffset = false;
  this.layer.draggable(true);
};

module.exports = UiBoard;

},{"./../../../common/index":35,"component-emitter":undefined,"kinetic":undefined}],18:[function(require,module,exports){
  'use strict';

var Game = require('./game'),
    Board = require('./board'),
    HexTile = require('./hex-tile'),
    HexCorner = require('./hex-corner'),
    HexEdge = require('./hex-edge'),
    Player = require('./player'),
    observableProps = require('./observable-properties');

function Factory() {}

Factory.prototype.createGame = function(options) {
  return new Game(this, options);
};

Factory.prototype.createBoard = function(options) {
  return new Board(this, options);
};

Factory.prototype.createHexTile = function(options) {
  return new HexTile(this, options);
};

Factory.prototype.createHexCorner = function(options) {
  return new HexCorner(this, options);
};

Factory.prototype.createHexEdge = function(options) {
  return new HexEdge(this, options);
};

Factory.prototype.createPlayer = function(options) {
  return new Player(this, options);
};

Factory.prototype.defineProperties = observableProps.defineProperties;

module.exports = Factory;

},{"./board":17,"./game":19,"./hex-corner":20,"./hex-edge":21,"./hex-tile":22,"./observable-properties":25,"./player":26}],19:[function(require,module,exports){
'use strict';

var emitter = require('component-emitter'),
    common = require('./../../../common/index'),
    Game = common.Game;

function UiGame() {
  Game.apply(this, arguments);
  emitter(this);
}

common.util.inherits(UiGame, Game);

UiGame.prototype.offerTrade = function(options) {
  Game.prototype.offerTrade.call(this, options);
  this.emit('TradeOffered');
};

UiGame.prototype.draw = function() {
  this.emit('draw');
};

UiGame.prototype.getPlayerColors = function() {
  if (!this._playerColors) {

    var colors = ['#ff0000', '#00ff00', '#0000ff'],
        players1 = [],
        players2 = [],
        result = {};

    this.players.forEach(function(player) {
      if (player.id === window.userId) {
        players1.push(player.id);
      } else {
        if (players1.length > 0) {
          players1.push(player.id);
        } else {
          players2.push(player.id);
        }
      }
    });

    players1
      .concat(players2)
      .forEach(function(playerId, index) {
        result[playerId] = colors[index];
      });

    this._playerColors = result;
  }
  return this._playerColors;
};

UiGame.prototype.showBuildableSettlements = function() {
  var currentPlayer = this.currentPlayer,
      corners = this.getBuildableCornersForCurrentPlayer();

  corners.forEach(function(corner) {
    corner.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.showBuildableEdges = function(cornerId) {
  var currentPlayer = this.currentPlayer,
      edges = this.getBuildableEdgesForCurrentPlayer(cornerId);

  edges.forEach(function(edge) {
    edge.show(currentPlayer);
  });

  this.draw();
};

UiGame.prototype.hideBuildableEntities = function() {
  this.board.corners.query({
    buildable: true
  })
  .forEach(function(corner) {
    corner.hide();
  });

  this.board.edges.query({
    buildable: true
  })
  .forEach(function(edge) {
    edge.hide();
  });

  this.draw();
};

module.exports = UiGame;

},{"./../../../common/index":35,"component-emitter":undefined}],20:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    HexCorner = common.HexCorner;

function UiHexCorner(factory, options) {
  HexCorner.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

common.util.inherits(UiHexCorner, HexCorner);

UiHexCorner.prototype.render = function(options) {
  this.group = new Kinetic.Group({
    x: options.center.x,
    y: options.center.y,
    visible: false
  });

  this.circle = new Kinetic.Circle({
    x: 0,
    y: 0,
    radius: 8
  });

  this.group.add(this.circle);
};

UiHexCorner.prototype.hookupEvents = function() {
  this.circle.on('mouseover', function() {
    $(this.circle.getStage().container()).addClass('clickable');
  }.bind(this));

  this.circle.on('mouseout', function() {
    $(this.circle.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.circle.on('click', function() {
    this.emit('click', {
      type: 'corner',
      id: this.id
    });
  }.bind(this));

  this.circle.on('tap', function() {
    this.emit('click', {
      type: 'corner',
      id: this.id
    });
  }.bind(this));
};

UiHexCorner.prototype.build = function(player) {
  var colors = this.board.game.getPlayerColors();

  HexCorner.prototype.build.call(this, player);

  this.circle.fill(colors[player.id]);
  this.circle.opacity(1);
  this.group.show();
  this.group.draw();
};

UiHexCorner.prototype.show = function(player) {
  var colors;
  if (this.isBuildable) {
    colors = this.board.game.getPlayerColors();
    this.circle.fill(colors[player.id]);
    this.circle.opacity(0.4);
    this.group.show();
    this.group.draw();
  }
};

UiHexCorner.prototype.hide = function() {
  if (this.isBuildable) {
    this.group.hide();
    this.group.draw();
  }
};

module.exports = UiHexCorner;

},{"./../../../common/index":35,"component-emitter":undefined,"jquery":undefined,"kinetic":undefined}],21:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    HexEdge = common.HexEdge,
    MathHelper = common.MathHelper;

function UiHexEdge(factory, options) {
  HexEdge.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

common.util.inherits(UiHexEdge, HexEdge);

UiHexEdge.prototype.render = function(options) {
  var rotation = MathHelper.getAngle(options.ends[0], options.ends[1]),
      height = 10,
      width = options.hexInfo.circumradius - 30;

  this.group = new Kinetic.Group({
    x: options.center.x,
    y: options.center.y,
    rotation: rotation
  });

  this.rect = new Kinetic.Rect({
    x: -width / 2,
    y: -height / 2,
    width: width,
    height: height,
    visible: false
  });

  this.group.add(this.rect);
};

UiHexEdge.prototype.hookupEvents = function() {
  this.rect.on('mouseover', function() {
    return $(this.rect.getStage().container()).addClass('clickable');
  }.bind(this));

  this.rect.on('mouseout', function() {
    return $(this.rect.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.rect.on('click', function() {
    this.emit('click', {
      type: 'edge',
      id: this.id
    });
  }.bind(this));

  this.rect.on('tap', function() {
    this.emit('click', {
      type: 'edge',
      id: this.id
    });
  }.bind(this));
};

UiHexEdge.prototype.build = function(player) {
  var colors = this.board.game.getPlayerColors();

  HexEdge.prototype.build.call(this, player);

  this.rect.fill(colors[player.id]);
  this.rect.opacity(1);
  this.rect.show();
  this.rect.draw();
};

UiHexEdge.prototype.show = function(player) {
  if (this.isBuildable) {
    var colors = this.board.game.getPlayerColors();
    this.rect.fill(colors[player.id]);
    this.rect.opacity(0.4);
    this.rect.show();
    this.rect.draw();
  }
};

UiHexEdge.prototype.hide = function() {
  this.rect.opacity(0);
  this.rect.hide();
  this.rect.draw();
};

module.exports = UiHexEdge;

},{"./../../../common/index":35,"component-emitter":undefined,"jquery":undefined,"kinetic":undefined}],22:[function(require,module,exports){
'use strict';

var _ = require('underscore'),
    Kinetic = require('kinetic'),
    common = require('./../../../common/index'),
    HexTile = common.HexTile,
    NumberToken = require('./number-token'),
    theme = require('./../theme');

function UiHexTile(factory, options) {
  HexTile.apply(this, arguments);
  this.addToBoard = this.addToBoard.bind(this);
  this.render(options);
}

common.util.inherits(UiHexTile, HexTile);

UiHexTile.prototype.render = function(options) {
  var tileStyle = theme.tiles[options.type],
      tileSpacing = theme.board.tilespacing || 8,
      hexagonOpts = this.getHexOptions(tileStyle, tileSpacing, options.hexInfo);

  this.numberToken = null;

  this.hexagon = new Kinetic.RegularPolygon(hexagonOpts);
  this.group = new Kinetic.Group({
    x: options.center.x,
    y: options.center.y
  });

  this.group.add(this.hexagon);

  if (tileStyle.stroke) {
    this.hexagon2 = new Kinetic.RegularPolygon({
      x: 0,
      y: 0,
      sides: 6,
      radius: options.hexInfo.circumradius - tileSpacing,
      rotation: 270,
      stroke: tileStyle.stroke,
      strokeWidth: tileStyle.strokeWidth || 1
    });
    this.group.add(this.hexagon2);
  }

  if (theme.board && theme.board.bgcolor) {
    this.bgHexagon = new Kinetic.RegularPolygon({
      x: options.center.x,
      y: options.center.y,
      sides: 6,
      radius: options.hexInfo.circumradius + tileSpacing,
      rotation: 270,
      fill: theme.board.bgcolor
    });
  }
  this.group.add(this.hexagon2);

  if (options.value > 0) {
    this.addNumberToken(options.value);
  }
};

UiHexTile.prototype.getHexOptions = function(tileStyle, tileSpacing, hexInfo) {
  var patternScale = hexInfo.circumradius * 2 / tileStyle.bgimage.width,
      options = {
        x: 0,
        y: 0,
        sides: 6,
        radius: hexInfo.circumradius - tileSpacing,
        rotation: 270,
        fill: tileStyle.bgcolor,
        opacity: tileStyle.opacity || 1
      };

  if (tileStyle.bgimage) {
    options = _.extend(options, {
      fillPriority: 'pattern',
      fillPatternImage: tileStyle.bgimage,
      fillPatternScaleX: patternScale,
      fillPatternScaleY: patternScale,
      fillPatternRotation: 90,
      fillPatternY: -hexInfo.circumradius,
      fillPatternX: -hexInfo.apothem
    });
  }
  return options;
};

UiHexTile.prototype.addNumberToken = function(value) {
  this.numberToken = new NumberToken(value);
  return this.group.add(this.numberToken.group);
};

UiHexTile.prototype.addToBoard = function(board) {
  HexTile.prototype.addToBoard.call(this, board);
  if (this.numberToken) {
    return board.on('board:rotate', this.numberToken.onBoardRotate);
  }
};

module.exports = UiHexTile;

},{"./../../../common/index":35,"./../theme":32,"./number-token":23,"kinetic":undefined,"underscore":undefined}],23:[function(require,module,exports){
'use strict';

var Kinetic = require('kinetic');

function NumberToken(value) {
  this.onBoardRotate = this.onBoardRotate.bind(this);
  this.render(value);
}

NumberToken.prototype.getDotInfo = function(value) {
  var count = value - 1,
      color,
      offset;

  if (count > 6) {
    count = count * -1 + 12;
  }

  color = count === 5 ? '#a23129' : '#000';
  offset = -2 * (count + 1);

  return {
    count: count,
    color: color,
    offset: offset
  };
};

NumberToken.prototype.render = function(value) {
  var dotInfo = this.getDotInfo(value);

  this.group = new Kinetic.Group({
    x: 0,
    y: 0,
    rotation: 0
  });

  this.renderCircle();
  this.renderText(dotInfo, value);
  this.renderDots(dotInfo);
};

NumberToken.prototype.renderCircle = function() {
  var circle = new Kinetic.Circle({
    x: 0,
    y: 0,
    radius: 20,
    fill: '#fff',
    stroke: 'grey',
    strokeWidth: 1
  });
  this.group.add(circle);
};

NumberToken.prototype.renderText = function(dotInfo, value) {
  var text = new Kinetic.Text({
    text: value.toString(),
    fill: dotInfo.color,
    fontSize: 16,
    align: 'center'
  });
  text.setX(text.getWidth() / 2 * -1);
  text.setY(text.getHeight() / 2 * -1);
  this.group.add(text);
};

NumberToken.prototype.renderDots = function(dotInfo) {
  for (var i = 1; i <= dotInfo.count; i++) {
    this.group.add(new Kinetic.Circle({
      x: (4 * i) + dotInfo.offset,
      y: 12,
      radius: 1,
      fill: dotInfo.color
    }));
  }
};

NumberToken.prototype.onBoardRotate = function(rotation) {
  return this.group.rotation(-rotation);
};

module.exports = NumberToken;

},{"kinetic":undefined}],24:[function(require,module,exports){
/*!
 * Based on Knockout ES5 plugin - https://github.com/SteveSanderson/knockout-es5
 * Copyright (c) Steve Sanderson
 * MIT license
 */

'use strict';

// Array handling
// --------------
//
// Arrays are special, because unlike other property types, they have standard
// mutator functions (`push`/`pop`/`splice`/etc.) and it's desirable to trigger
// a change notification whenever one of those mutator functions is invoked.
//
// Traditionally, Knockout handles this by putting special versions of
// `push`/`pop`/etc. on observable arrays that mutate the underlying array and
// then trigger a notification. That approach doesn't work for Knockout-ES5
// because properties now return the underlying arrays, so the mutator runs
// in the context of the underlying array, not any particular observable:
//
//     // Operates on the underlying array value
//     myModel.someCollection.push('New value');
//
// To solve this, Knockout-ES5 detects array values, and modifies them as
// follows:
//  1. Associates a hidden subscribable with each array instance that it
//     encounters
//  2. Intercepts standard mutators (`push`/`pop`/etc.) and makes them trigger
//     the subscribable
// Then, for model properties whose values are arrays, the property's underlying
// observable subscribes to the array subscribable, so it can trigger a change
// notification after mutation.

// After each array mutation, fires a notification on the given subscribable
function wrapStandardArrayMutators(array, subscribable, signal) {
  var fnNames =
    ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
  fnNames.forEach(function(fnName) {
    var origMutator = array[fnName];
    array[fnName] = function() {
      var result = origMutator.apply(this, arguments);
      if (signal.pause !== true) {
        subscribable.notifySubscribers(this);
      }
      return result;
    };
  });
}

// Adds Knockout's additional array mutation functions to the array
function addKnockoutArrayMutators(ko, array, subscribable, signal) {
  var fnNames = ['remove', 'removeAll', 'destroy', 'destroyAll', 'replace'];
  fnNames.forEach(function(fnName) {
    // Make it a non-enumerable property for consistency with standard Array
    // functions
    Object.defineProperty(array, fnName, {
      enumerable: false,
      value: function() {
        var result,
            fn;

        // These additional array mutators are built using the underlying
        // push/pop/etc. mutators, which are wrapped to trigger notifications.
        // But we don't want to trigger multiple notifications, so pause the
        // push/pop/etc. wrappers and delivery only one notification at the end
        // of the process.
        signal.pause = true;
        try {
          // Creates a temporary observableArray that can perform the operation.
          fn = ko.observableArray.fn[fnName];
          result = fn.apply(ko.observableArray(array), arguments);
        }
        finally {
          signal.pause = false;
        }
        subscribable.notifySubscribers(array);
        return result;
      }
    });
  });
}

// Gets or creates a subscribable that fires after each array mutation
function getSubscribableForArray(ko, array) {
  var subscribable = array._subscribable,
      signal = {};

  if (!subscribable) {
    subscribable = array._subscribable = new ko.subscribable();

    wrapStandardArrayMutators(array, subscribable, signal);
    addKnockoutArrayMutators(ko, array, subscribable, signal);
  }

  return subscribable;
}

// Listens for array mutations, and when they happen, cause the observable to
// fire notifications. This is used to make model properties of type array fire
// notifications when the array changes.
// Returns a subscribable that can later be disposed.
function startWatchingarray(ko, observable, array) {
  var subscribable = getSubscribableForArray(ko, array);
  return subscribable.subscribe(observable);
}

// Given an observable that underlies a model property, watch for any array
// value that might be assigned as the property value, and hook into its change
// events
function notifyWhenPresentOrFutureArrayValuesMutate(ko, observable) {
  var watchingArraySubscription = null;
  ko.computed(function() {
      // Unsubscribe to any earlier array instance
    if (watchingArraySubscription) {
      watchingArraySubscription.dispose();
      watchingArraySubscription = null;
    }

    // Subscribe to the new array instance
    var newarray = observable();
    if (newarray instanceof Array) {
      watchingArraySubscription = startWatchingarray(ko, observable, newarray);
    }
  });
}

module.exports = notifyWhenPresentOrFutureArrayValuesMutate;

},{}],25:[function(require,module,exports){
/*!
 * Based on Knockout ES5 plugin - https://github.com/SteveSanderson/knockout-es5
 * Copyright (c) Steve Sanderson
 * MIT license
 */

'use strict';

var ko = require('knockout'),
    notifyWhenPresentOrFutureArrayValuesMutate = require('./observable-arrays');

function defineObservableProperty(obj, propertyName, value) {
  var isComputed = typeof value === 'function',
      isArray = Array.isArray(value),
      observable;

  if (isComputed) {
    observable = ko.computed(value, obj);
  } else if (isArray) {
    observable = ko.observableArray(value);
    notifyWhenPresentOrFutureArrayValuesMutate(ko, observable);
  } else {
    observable = ko.observable(value);
  }

  obj._observables = obj._observables || {};
  obj._observables[propertyName] = observable;

  if (isComputed) {
    Object.defineProperty(obj, propertyName, {
      get: observable
    });
  } else {
    Object.defineProperty(obj, propertyName, {
      get: observable,
      set: observable
    });
  }
}

function defineObservableProperties(obj, properties) {
  var props, simple, computed;

  obj._observables = obj._observables || {};

  if (!obj.getObservable) {
    obj.getObservable = function getObservable(observableName) {
      return this._observables[observableName];
    }.bind(obj);
  }

  if (!obj.subscribe) {
    obj.subscribe = function subscribe(observableName, fn) {
      var observable = this._observables[observableName];
      if (observable) {
        observable.subscribe(fn);
      }
    }.bind(obj);
  }

  props = Object.getOwnPropertyNames(properties)
    .map(function(name) {
      return {
        name: name,
        value: properties[name]
      };
    });

  simple = props.filter(function(prop) {
    return typeof prop.value !== 'function';
  });

  computed = props.filter(function(prop) {
    return typeof prop.value === 'function';
  });

  simple.concat(computed).forEach(function(prop) {
    defineObservableProperty(obj, prop.name, prop.value);
  });
}

function copyObservables() {
  var obj = arguments[0],
      others = Array.prototype.slice.call(arguments, 1);

  others
  .filter(function(item) {
    return item._observables ? true : false;
  })
  .forEach(function(item) {
    var propNames = Object.getOwnPropertyNames(item);
    propNames.forEach(function(propName) {
      var propDescriptor = Object.getOwnPropertyDescriptor(item, propName);
      Object.defineProperty(obj, propName, propDescriptor);
    });
  });
}

module.exports = {
  defineProperty: defineObservableProperty,
  defineProperties: defineObservableProperties,
  copyObservables: copyObservables
};

},{"./observable-arrays":24,"knockout":undefined}],26:[function(require,module,exports){
'use strict';

var emitter = require('component-emitter'),
    common = require('./../../../common/index'),
    Player = common.Player;

function UiPlayer() {
  Player.apply(this, arguments);
  emitter(this);
}

common.util.inherits(UiPlayer, Player);

UiPlayer.prototype.distribute = function(resources) {
  Player.prototype.distribute.call(this, resources);
  this.emit('updated');
};

UiPlayer.prototype.spend = function(resources) {
  Player.prototype.spend.call(this, resources);
  this.emit('updated');
};

UiPlayer.prototype.addVictoryPoint = function(devCard) {
  Player.prototype.addVictoryPoint.call(this, devCard);
  this.emit('updated');
};

module.exports = UiPlayer;

},{"./../../../common/index":35,"component-emitter":undefined}],27:[function(require,module,exports){
'use strict';

var _ = require('underscore'),
    PlayerModel = require('./player.js'),
    observableProps = require('./../game/observable-properties');

function RoomModel(options) {
  this.factory = options.factory;
  this.actions = options.actions;
  this.emitterQueue = options.emitterQueue;
  this.notifications = options.notifications;

  observableProps.defineProperties(this, {
    game: null,
    users: [],

    turn: this.getTurn,
    myTurn: this.isMyTurn,
    players: this.getPlayers,
    currentPlayer: this.getCurrentPlayer,
    thisPlayer: this.getThisPlayer,
    thisPlayerOrEmpty: this.getThisPlayerOrEmpty,
    otherPlayers: this.getOtherPlayers,
    otherPlayersOrdered: this.getOtherPlayersOrdered
  });
}

RoomModel.prototype.getTurn = function() {
  return this.game && this.game.turn || 0;
};

RoomModel.prototype.isMyTurn = function() {
  var game = this.game || {},
      currentPlayer = game.currentPlayer || {};

  return currentPlayer.id === window.userId || false;
};

RoomModel.prototype.getPlayers = function() {
  var users = this.users,
      game = this.game;

  if (game) {
    return game.players.map(function(player) {
      var user = _.find(users, function(user) {
        return user.id === player.id;
      });

      user = user || {
        id: player.id,
        username: '',
        name: '',
        avatarUrl: ''
      };

      return new PlayerModel(user, player);
    });

  } else {
    return users.map(function(user) {
      var ply = this.factory.createPlayer({
        id: user.id
      });
      return new PlayerModel(user, ply);
    }, this);
  }
};

RoomModel.prototype.getCurrentPlayer = function() {
  var game = this.game || {},
      currentPlayer = game.currentPlayer || {},
      currentPlayerId = currentPlayer.id || null;

  if (currentPlayerId) {
    return _.find(this.players, function(player) {
      return player.id === currentPlayerId;
    });
  } else {
    return null;
  }
};

RoomModel.prototype.getThisPlayer = function() {
  return _.find(this.players, function(player) {
    return player.id === window.userId;
  });
};

RoomModel.prototype.getThisPlayerOrEmpty = function() {
  var player = this.getThisPlayer(),
      user,
      ply;

  if (!player) {
    user = {
      id: '',
      username: '',
      name: '',
      avatarUrl: ''
    };
    ply = this.factory.createPlayer({
      id: user.id
    });
    player = new PlayerModel(user, ply);
  }

  return player;
};

RoomModel.prototype.getOtherPlayers = function() {
  return this.players.filter(function(player) {
    return player.id !== window.userId;
  });
};

RoomModel.prototype.getOtherPlayersOrdered = function() {
  var thisPlayer = false,
      players1 = [],
      players2 = [];

  this.players.forEach(function(player) {
    if (player.id === window.userId) {
      thisPlayer = true;
    } else {
      if (thisPlayer) {
        players1.push(player);
      } else {
        players2.push(player);
      }
    }
  });

  return players1.concat(players2);
};

module.exports = RoomModel;

},{"./../game/observable-properties":25,"./player.js":28,"underscore":undefined}],28:[function(require,module,exports){
'use strict';

var emitter = require('component-emitter'),
    props = require('./../game/observable-properties');

function PlayerModel(user, player) {
  emitter(this);

  props.copyObservables(this, user, player);
  this.user = user || {};
  this.player = player || {};
}

module.exports = PlayerModel;

},{"./../game/observable-properties":25,"component-emitter":undefined}],29:[function(require,module,exports){
'use strict';

var PERMISSION_DEFAULT = 'default',
    PERMISSION_GRANTED = 'granted',
    PERMISSION_DENIED = 'denied',
    PERMISSION = [PERMISSION_GRANTED, PERMISSION_DEFAULT, PERMISSION_DENIED];

function Notifications(emitterQueue) {
  this.emitterQueue = emitterQueue;
  this.isSupported = window.localStorage &&
    ((window.Notification != null) ||
    (window.webkitNotifications != null) ||
    (window.navigator.mozNotification != null));
  this.isEnabled = false;
  this.checkIfPreviouslyEnabled();
  this.setupNotifications();
}

Notifications.prototype.checkIfPreviouslyEnabled = function() {
  var setting = window.localStorage.getItem('settings.notifications'),
      permitted = this.getPermission() === PERMISSION_GRANTED;

  this.isEnabled = setting && permitted ? true : false;
};

Notifications.prototype.enable = function(fn) {
  var permission = this.getPermission();

  if (permission !== PERMISSION_GRANTED) {
    this.requestPermission(function(permission) {
      if (permission === PERMISSION_GRANTED) {
        window.localStorage.setItem('settings.notifications', true);
        fn(this.isEnabled = true);
      } else {
        this.disable(fn);
      }
    }.bind(this));
  } else {
    window.localStorage.setItem('settings.notifications', true);
    fn(this.isEnabled = true);
  }
};

Notifications.prototype.disable = function(fn) {
  window.localStorage.removeItem('settings.notifications');
  fn(this.isEnabled = false);
};

Notifications.prototype.toggle = function(fn) {
  if (this.isEnabled) {
    this.disable(fn);
  } else {
    this.enable(fn);
  }
};

Notifications.prototype.getPermission = function() {
  if (window.Notification && window.Notification.permission) {
    return window.Notification.permission;
  } else if (window.Notification && window.Notification.permissionLevel) {
    return window.Notification.permissionLevel();
  } else if (window.webkitNotifications &&
              window.webkitNotifications.checkPermission) {
    return PERMISSION[window.webkitNotifications.checkPermission()];
  } else if (navigator.mozNotification) {
    return PERMISSION_GRANTED;
  }
};

Notifications.prototype.requestPermission = function(fn) {
  if (window.Notification && window.Notification.requestPermission) {
    window.Notification.requestPermission(fn);
  } else if (window.webkitNotifications &&
              window.webkitNotifications.checkPermission) {
    window.webkitNotifications.requestPermission(fn);
  }
};

Notifications.prototype.createNotification = function(title, body) {
  if (this.isEnabled) {
    if (window.Notification) {
      this.notification = new window.Notification(title, {
        body: body,
        tag: window.roomId
      });
    } else if (window.webkitNotifications != null) {
      this.notification =
        window.webkitNotifications.createNotification(null, title, body);
      this.notification.show();
    } else if (window.navigator.mozNotification != null) {
      this.notification =
        navigator.mozNotification.createNotification(title, body);
      this.notification.show();
    }
  }
};

Notifications.prototype.closeNotification = function() {
  if (this.notification != null) {
    if (this.notification.close != null) {
      this.notification.close();
    } else if (this.notification.cancel != null) {
      this.notification.cancel();
    }
    this.notification = null;
  }
};

Notifications.prototype.setupNotifications = function() {
  this.emitterQueue.on('NextTurn', this.onNextTurn.bind(this));
};

Notifications.prototype.onNextTurn = function(data, next) {
  this.closeNotification();
  if (data.playerId === window.userId) {
    this.createNotification('Colonizers', 'Your turn');
  }
  next();
};

module.exports = Notifications;

},{}],30:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Hammer = require('hammerjs');

require('jquery-mousewheel')($);

function TwoFingerRecognizer() {
  Hammer.AttrRecognizer.apply(this, arguments);
}

Hammer.inherit(TwoFingerRecognizer, Hammer.AttrRecognizer, {
  defaults: {
    event: 'twofinger',
    pointers: 2
  },
  getTouchAction: function() {
    return [Hammer.TOUCH_ACTION_NONE];
  },
  attrTest: function(input) {
    return this._super.attrTest.call(this, input);
  }
});

function StageNavigator(stage) {

  var container = stage.container(),
      targetFps = 60;

  emitter(this);

  this.stage = stage;
  this.reset();

  this.hammerManager = new Hammer.Manager(container);
  this.hammerManager.add(new TwoFingerRecognizer());
  this.hammerManager.on('twofinger', this.onHammerTransform.bind(this));
  this.hammerManager.on('twofingerend', this.onHammerTransformEnd.bind(this));

  $(container).on('mousewheel', this.onMousewheel.bind(this));

  if (window.wiiu && window.wiiu.gamepad) {
    setInterval(this.onWiiuInput.bind(this), 1000 / targetFps);
  }
}

StageNavigator.prototype.reset = function() {
  this.transformOrigin = null;
  this.minScale = 1;
  this.transform = {
    rotation: 0,
    scale: 1
  };
};

StageNavigator.prototype.stageResized = function(board) {
  var minCanvas, maxDimension;

  if (board) {
    minCanvas = Math.min(this.stage.height, this.stage.width);
    maxDimension = Math.max(board.height, board.width);
    this.minScale = minCanvas / maxDimension;
  } else {
    this.minScale = 1;
  }
};

StageNavigator.prototype.addBoard = function(board) {
  this.stageResized(board);
  this.on('stage:transform', board.onStageTransform);
  this.on('stage:transformend', board.onStageTransformEnd);
};

StageNavigator.prototype.removeBoard = function(board) {
  this.off('stage:transform', board.onStageTransform);
  this.off('stage:transformend', board.onStageTransformEnd);
  this.reset();
};

StageNavigator.prototype.setTransform = function(rotation, scale, center) {
  scale = scale < this.minScale ? this.minScale : scale;
  scale = scale > 2 ? 2 : scale;
  this.transform.rotation = rotation;
  this.transform.scale = scale;
  this.emit('stage:transform', {
    rotation: this.transform.rotation,
    scale: this.transform.scale,
    center: center
  });
};

StageNavigator.prototype.onMousewheel = function(event) {
  var rotation, scale;

  event.preventDefault();

  if (event.ctrlKey) {
    rotation = this.transform.rotation + event.deltaY * 0.02;
    this.setTransform(rotation, this.transform.scale);
  } else {
    scale = this.transform.scale + event.deltaY * 0.0012;
    this.setTransform(this.transform.rotation, scale);
  }
};

StageNavigator.prototype.onHammerTransform = function(event) {
  var rotation, scale;

  if (this.transformOrigin == null) {
    this.stage.draggable(false);
    this.transformOrigin = {
      rotation: this.transform.rotation,
      scale: this.transform.scale
    };
  }

  rotation = this.transformOrigin.rotation + event.rotation;
  scale = this.transformOrigin.scale * event.scale;
  this.setTransform(rotation, scale, event.center);
};

StageNavigator.prototype.onHammerTransformEnd = function() {
  this.transformOrigin = null;
  this.emit('stage:transformend');
};

StageNavigator.prototype.onWiiuInput = function() {
  var buttonMap = {
        lStickUp: 0x10000000,
        lStickDown: 0x08000000,
        lStickLeft: 0x40000000,
        lStickRight: 0x20000000,
        rStickUp: 0x01000000,
        rStickDown: 0x00800000,
        rStickLeft: 0x04000000,
        rStickRight: 0x02000000,
        lStickButton: 0x00040000,
        rStickButton: 0x00020000
      },
      state = window.wiiu.gamepad.update(),
      dragX = 0,
      dragY = 0,
      rotate = 0,
      zoom = 0,
      rotation,
      scale;

  if (state.isEnabled && state.isDataValid) {
    if (state.hold & 0x7f86fffc & buttonMap.lStickUp) {
      dragX++;
    }
    if (state.hold & 0x7f86fffc & buttonMap.lStickDown) {
      dragX--;
    }
    if (state.hold & 0x7f86fffc & buttonMap.lStickLeft) {
      dragY++;
    }
    if (state.hold & 0x7f86fffc & buttonMap.lStickRight) {
      dragY--;
    }
    if (state.hold & 0x7f86fffc & buttonMap.rStickLeft) {
      rotate--;
    }
    if (state.hold & 0x7f86fffc & buttonMap.rStickRight) {
      rotate++;
    }
    if (state.hold & 0x7f86fffc & buttonMap.rStickUp) {
      zoom++;
    }
    if (state.hold & 0x7f86fffc & buttonMap.rStickDown) {
      zoom--;
    }
    rotation = this.transform.rotation + rotate * 20;
    scale = this.transform.scale + (10 + zoom) * 0.1;
    this.setTransform(rotation, scale);
  }
};

module.exports = StageNavigator;

},{"component-emitter":undefined,"hammerjs":undefined,"jquery":undefined,"jquery-mousewheel":undefined}],31:[function(require,module,exports){
'use strict';

var StageNavigator = require('./stage-navigator'),
    $ = require('jquery'),
    Kinetic = require('kinetic');

function Stage(container) {
  this.onResize = this.onResize.bind(this);
  this.draw = this.draw.bind(this);

  this.container = container;
  this.game = null;
  this.board = null;
  this.minScale = 1;
  this.height = $(this.container).height();
  this.width = $(this.container).width();
  this.stage = new Kinetic.Stage({
    container: this.container,
    width: this.width,
    height: this.height
  });
  this.waitingLayer = this.getWaitingLayer();
  this.stage.add(this.waitingLayer);
  this.navigator = new StageNavigator(this.stage);
  $(window).on('resize', this.onResize);
}

Stage.prototype.getWaitingLayer = function() {
  var layer = new Kinetic.Layer({
        x: this.width / 2,
        y: this.height / 2
      }),
      text = new Kinetic.Text({
        width: this.width - 40,
        align: 'center',
        text: 'Waiting for more players...',
        fill: '#666',
        opacity: 0.8,
        fontSize: 48
      });

  text.position({
    x: text.getWidth() / -2,
    y: text.getHeight() / -2
  });

  layer.add(text);

  return layer;
};

Stage.prototype.draw = function() {
  this.stage.batchDraw();
};

Stage.prototype.addGame = function(game) {
  this.game = game;
  this.game.on('draw', this.draw);
  this._addBoard(this.game.board);
};

Stage.prototype._addBoard = function(board) {
  this.board = board;
  this.board.layer.x(this.width / 2);
  this.board.layer.y(this.height / 2);
  this.waitingLayer.remove();
  this.stage.add(this.board.layer);
  this.navigator.addBoard(this.board);
};

Stage.prototype.removeGame = function() {
  if (this.game) {
    this.game.off('draw', this.draw);
    this._removeBoard(this.game.board);
    this.game = null;
  }
};

Stage.prototype._removeBoard = function() {
  this.navigator.removeBoard(this.board);
  this.board.layer.remove();
  this.stage.add(this.waitingLayer);
  this.board = null;
};

Stage.prototype.onResize = function() {
  this.height = $(this.container).height();
  this.width = $(this.container).width();
  this.stage.height(this.height);
  this.stage.width(this.width);
  this.stage.batchDraw();
  this.navigator.stageResized(this.board);
};

module.exports = Stage;

},{"./stage-navigator":30,"jquery":undefined,"kinetic":undefined}],32:[function(require,module,exports){
'use strict';

var image = function(src) {
  var img = new Image();
  img.src = src;
  return img;
};

module.exports = {
  board: {
    bgcolor: '#f1f1f2',
    tilespacing: 8
  },
  tiles: {
    sea: {
      opacity: 0.9,
      stroke: '#3ba7d5',
      strokeWidth: 4,
      bgcolor: '#3ba7d5',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfACOU0Rpyufj7/Ses4iszi2Kg0J7V7igqciRkrySg2SGIyCRXpilHmtrs9mzE6Zmy0x9rtGFlnx59wRul38Td7oaKtiav5b7B2EZDeA9ut0a25CYiYSs4jxt1uyap4P///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmViZTQ3ZGM4LWQyYmMtNDNiYS04YzM0LTg5ZmZkNDk3YjZlZCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCQjVCQUREQjE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCQjVCQUREQTE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0ZGNkMDJmMS02OGU0LTQ5ODUtOGRhZC1iOGVhNzNjMGM1ZWUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZWJlNDdkYzgtZDJiYy00M2Jh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')
    },
    desert: {
      opacity: 0.9,
      stroke: '#fce571',
      strokeWidth: 4,
      bgcolor: '#fce571',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfAMZxUrBXOvz39fXSyJZQQ+u4p7tiRuzEt7BcQc2CadGHb+Krmdeahsl8Y4dEPN6jj9KLcbV2ZtGSfdSwqLpsVKJhU7pgQemzoc+Ibct2VfPKvqpUOYtJQNCFbb5kR////yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjhjZWYyMTM3LWY1NmEtNDUzZi1iODE0LTgzNzMzYzA0MjViNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxMkY1OTMxMTE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxMkY1OTMxMDE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowNDI4MjRkZC1mZDdmLTQwYmItOGQ4NC05ZGU4NDM2YTUxOTgiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OGNlZjIxMzctZjU2YS00NTNm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')
    },
    lumber: {
      opacity: 0.9,
      stroke: '#359450',
      strokeWidth: 4,
      bgcolor: '#359450',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfACZ1Tvv8+wFpNgCDQwJHIlGwfwFVKl6TeAI0GAB0O4Stl57BrwCRRlN3ZMba0LXQwtXk3QRBHgBeMCKRW+fw6ypaQD+FYRhSMQCLRTqhawCVSAg6HwBLIwCAQgBhMv///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjdmMzkwYzk3LWViNTctNDgwYS1hYjFiLWYwMzA3NjA1ODc3ZiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxMkY1OTMwRDE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxMkY1OTMwQzE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NDk4ZjMxYi1hZTJhLTRkYWQtODAzNS1hZWQwODNhMGZmZjAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N2YzOTBjOTctZWI1Ny00ODBhLWFiMWItZjAzMDc2MDU4NzdmIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAQAAHwAsAAAAAJABWgEABf/gJ45kaZ5oqq5siwZFLM90bd94ru9FdvyW3yEIFBKHRqGiwWw6n9CodEqtWq+NgGvL7Xq/4LB43HIwNOi0es1uu99sTGJOr9vv9E6iI+l7PH6AEn+BhYOAHhsbCIuNjI+OkZCTkpWUl4+QipucnJmLl6AKZKSlpqeoqS8YGHCur7BrAx20tba3uLYDCX+9vr/AwBKdxMXGx8jJGxHMBM4c0NHS0xzOzBHGCAgUqt3e3+CqCwmtsebnagy56+y0u8Hw8YTK9PX0zQTU+vv71tibCLKEG0iwoEESFNyhW2gOQ7uHuBIckkfxjwF7GDM248exIz9noBwcHEmy5BgYezr/lGPI0s0siDA7CJhYUd7FjDiPRXjmsadPahEqaDFJtKjREhBSdhjQsukadTFh1pzKIafVTTt/at0aLcKCo2DDHgww4dYZp05fRn04tSaBqzl5cp3r0xk3sXjzpnqgVCHalg7XPpTYluI/uPfy0V38M8IBvZAjhwmg1tbKv+gqC84loLC8YYiVZWVM2mcECJJTq16hoK+ts5gbbmbrOd7N0MZGl97dkYDA1cCBJ2THNHYsqLNzvasN7zZuTrp5S+cX4UHw65JhPCxuHA7y5LgGzGQe7O1zToqnq+d3YSj292EduM51uftT8O3Iwzv8PML6/9SNAt+ARZEVU332acCA/2b4uUOYfr6A1l96AFYoDQF3EajhQQusxV2C3zV4S2cQ+uIcYhRaqCIHjrm34YvfBLDZALAZF5iIuZT4i3mIRbfiiqfBKKQ3CiSHYFML4qjceDr+wZ9V/v0oJTQEAODikFiOkRR4NP51o5K4NNnLiXFNaSYHCFiX5ZqTZSBilwwxgAGDYC7FZJNVXeXjmStekCGbgLogn5IDYFCjd0nWyY6YvTyJUZR8mhmBgIFWqkIAXxJaKAOcdsopK3QqasudOkqIE6SRSvqnpayOMI6osHLJC6Me5IlTiqlK6duVrVY6XKzAbkaqjo7Sg2uuUkYgUq+sahfsszE9KCaZxiKbq/9QzFq6JbTcrrMcrTzac6y1yX6VLaABuNnturiQyKip9YxLrq68ngsjX+zmayetf9ga77zIOmZvlpTpy+63tGYkr7UGcGDAww03DGCQAwupgAehGqwowoxSe8zCZj7cB03w9PGwdLtW/CIFBnggQMYag8kvIcXmxjDJzJks8WLVqaxhAAccMl/MhHYws0X2oBqyATg3KcHJcxHQns8DOtAyIQnATHRywzpdczGRMn20MDtr5RXV7wUAAMlDbz3bLF3jKe6ZgYxdMlcRrIp2agtcHWHWbouIyMzwIgOyek3bHczTjT2292oBDP6LBC8H/rbRdvuLjNIWJq54PBI0htr/46kp4HcwAixleVQc8+sx2D+K/XltZVNnJemRQXD64gIAvjpE0h4druE/ej57RYx31DPueQVggfG++P77OnGLKYDmOq24+/HM1U6N1PUyT5TVbVE+fXizKl74MStCz/1UoXM0qfhhqe0+MHtorbG7ig//sYWye1+TvBcNAuSNfkdZAAdylrrVzYIX9yvR6zrBuelsT4ASpI4FwodAglAggotzmepi9sDquW5uALogBjO4D2V1sCRAA2HJRDjCdZVQhiX6GgUrpMIVlih+38PWCw+iOzENonc1BNZLEmBC4aFwPT304Q9baK4hEsR5OKwJEpOoKT10JosSTFoKpWg3/yBeiAMctCIqHhBFCB0xJQPQXzviSAsm8k+AEyTGGMlYRn0ggFJq9EYAmug0l21xKXHMWCJrMYc7rnB92YMiHz9HQIoFshum497I/iCA3uVBKXugQydJBEZaSUCHxDgcV9o4yQF+7zeXRMUHybjJzxCilYBA5Q7Xg8vZeW95sTRFDHtJTMMobD2lLGZNzBgNIQaTFORTpjR94b9kVJA0rJwmeZjJoio+Uwz202apkgmPaiZDlVrJpji7Nw27fHMMCyDAOuHni1Hac5QRYo45k4HMeR4NKI575xcCoAh1FnMinmxbRBpJCPedMifXXIxB+VXLRwJldALtwgEYsYEF+v9zcFtMJB0hssg6drJuk9OlMdD5k/cF4p6d7AU5PVO7KqUxoyagAEcV4VFtCi1/YFoiBGkCyXogbnZHPCQiK2NHyfVxGsDE6QoC0ICdKiICMz3aGxEZqyV+0QN5tKYFPzeIOXB1jnQ8KSXbOTWpruABVuVEVvmVupFC6yUCMEBcj8kbAsx1hnCckR6cSlGgANKtJgjABfa6iYmOraxctGECwoqMsdqtgQ16oOJ+qTfEikABjEUPLUUox2AVarIQRdlfJ9e70sJkF4TcJkBvKlAK1CMCjnVaA137rDgmYJ8rnY5W67oxmYztl8vy7Ag2ao+eck+hW5tFUWHHm9wiD7r/mW2d04ByO+V+AAKhRYZ1PWO+891iF9grRkTnQjjs4ki7OtLH2ZQbgAqE13CrFYZ7LTeLsK53K+OVB2Z7GzxXthONyoUrXDiQ315Iz7zhEcA5pZNfytmVwBWW72Ezqtj7GpVfkYWwLhLwNZZ6ZLXlzVdsC9PCzn4TtP0J4DaJK+I5/tYY0gkwPB68LtfJF5a19fCpGKyfAdd4jh3w33/T+S4ed2sXKG5hct9JVSFbhciFSfGRSZrkXe4mv1tzpH64SSVnftMBVoYLbu+n5S3HJFwm7gitnCxZWhGwmwKt73mUQQAZs9bNgpnFYeLMDx0DI3BiJs+dq+FiKy4gzXvu/3PTAD0jEiuC0PswtEzpfLACj5k6AY0lQfc8ZKYNIsSUtjFPebPa1b1Lfhi9JIxJDSVOp3qOiaCwbvm74ppwJGWX1Cmkad0JA/D21rUYgAEwrQ8j7pdbUBaT8tSkxioTOy7Ixs+it8KoZ3erYx1pqxXRfO2c2DrbNt6NpnuBaoP1miLbZtGG6dfhcmcEY+hOzgA8wGwqrbvNbnu3TTyCIUczYicIN6DCr8GMZVybAPlu0LIZs24a8npaHmnRCymw5I8YsOGhObeoRFqoktpQAP12mPWObVpPszPjsRbfATpel4/nxNjQ3tQbPnVhJca7I/8Weafn+vNqdFd8EKB51P8MaA+hZ/ZQr+AUywOdAIqv3IEup51P0kTvBqT8J9YQ79RZB/VzJKqrEmB20McOq2iX6id+Et8DlI6yYjn9bWWPE9u3U3W6/Ltyq8s6TRszb58pFllML+je23Ekp2QqqEXXx98XXye3s9A0jR6YAuheIWzc3UN5R0uICNX3VVrvd+IhulaAjTaOA8xhbQ/9X85ep4kDmFHTE7httuJCtAGN8xYCfFATxAbav5ff7BXT9MC9FTNXLOmv58DIid8G42e29Nx2mrcJzKi5zFdlavu6ailvFupXX1SRn8ZfjUxCwXtmMZln1QKAXyECCB9Hsif+6PEjHkK32nK6dzfeF2r/56JY4jcditJ45ocG5Ocgc1FxEvB5XeV+WcYzMccsmxd9OEcoC+gKDUgLtvcTFWdxJJRoLxc1QNYrrhd9+KYk+beAj8claccVc/aByWFnjBFVrUJVBzgdEjhHHfgKDSgeyXd6JbhapEEAzmcpDkB/KlInL9iBMfg22PcTKPaDpGdKpTE/vVJf0QcNBjB8QSiEYPKAILY/OFgaBdcq8/eFftWACjiGaTCFM5J+0kBXNhgt+WWHoEZbK1MNbtiCIhKFQbh/bzODW9Fg2/cm6WNE0mFJgTJzXwgN98clcggL5Nd/pscvWAgeM8OH8rOEWAJ9k8gBnYgLcXiJDPhe11OE/zXYW0bTYCFIGhHAdejidaVoiuSXiqpIhx5ShVZ4NKcYFVo1HZvgh/Axd7kofS6oiq5giFTnd2MzjDZGWAa2G+bxR2xigMsIJoQ4htD4i4vRYL1AY+81WGMzHdm4DWuSgbkYhu/ljM9YhtI4Nq1FebBFjhYxHYcREMgoHCwFMQL5NE8jkFCzGxwojztHj3Shj+V4VoFGCyYobcboCVO2Ib+XaaaWTDrjdwmpkNXXgFZXRi6TP3JER0zkS+rYCQggivBBimBoao9VkCL4kSB5H0pCGg6JP3BEciXFUMejHo6CAN5EIGrjHzIpQDTJEfD4Jjd5fjgCjLd3PH7QSXgQU/+CcDyg2BHH8I+R8QB+1UpLqQ+E8o2FeI6lsZMlUzcVpUnqYU4IQIBpE4DqQ0De+JQ4eX278VGfKJTHwI4EkknTlDzQQI21YJZS+F5SuYl8eY19hQz+OCCztE7JY5i0wIuX6Ius81tf1phv55eQSW3XMUwfZQCWuRR4qQaZiHK84ZmXJx3K0JJeCRbRxJeL2A6ISX3h6CHIp26uqWjrAVwAUXiREU58aWFKgplBqJlrgYi++ZsVuB4qpQjxhxd945rsZ4mp+YGzmJbQCT//IZyeIJfF+Z1QiJe7uZn/oZa0NDEYgQAXCBmC6ZqnqRJ4OYSL6Z3fKYDBmRGyqRpFBJ3/9dkBuWkc6ck6znlU+zk5W9kT0+kJoqkXzvOdyGmTzmiDBlQh7OmWACKexYAA4qYXtQmdilKgXhJUCbBqALKhs2MhV6GNkGGc3zmgBOqMB8o6ErYMnbOfZIYycAGYeXGdPEqjHzKGNjgAttKDmQadPQqbP5qCR/FBLPo5oqKcmHGkHQAdKuJn89QwSgoUoQGfeXEAI8hHNGqfQZiH+9YJX7oPU/pDDQp2uPGfYQEBb6o+lYgjVtoSebgU2NOmktelP3IeRFk/z7Ogv9BV5tenu6BeUnKn5ROnZkNqs+kNbISof9NVJuodXeUxTrhKkApvukJqMFogdLlOwbKnr8Cc//qWov8jJWWqH5LKFbSmDdUZDgoQqmR1mx6iqm0wJ0o0XR0VMlJEmMlCbKxHEpNJOG05Mht6V76qIMCqRK66OXzCpWU0q95HbP7ReyRBmuPESVaJB42Eldb4Q7yKdy8oJz3XdpT1qdi0k2NpJh6aE2VWqaUQoGMmrmbFVT45CxcGlP9nQ4XCCoZisO1KrU8UNih2MoDaE/V6K11RlFe0NtvEST2ZsFHBUDNVoRE3I+n1qsgiMjjUkdYSsRrRTre6RtZVViYJK3PQJGd6ZOIhsScrDQYpMjn7heWWIgJjEJEjQ1vVbu9VQueqRR8bkVfmhr0RfQ+ashdlEPM5FUjUp/9IZlxglKdJ6y0hSw/L+LXQ8LR81U5Q2g0sUz73SEJYWxszez5rumBgW4pi+yjUEaHdgEXLlLYAyBxby3ehAa9x+x9zK0YcEaLdMKKABWGNSLV96y0dMLjUFbjWArn/Ij/EWQoyWjJKNT1w4xnZubWz0LVlIrm5Qrn34KArCwZCKg9AVWPwVTLpSrOUNbakayb2pqK9cQD42gIUUBOxuz8RFIFWS0ISMGy3pa21K6e3y1KQeApT+2fZNpH4M7z6MgDCahVhibzJ2xu3uwEmZlOpoK/C8Llb5luF0bb5Yr3G67URsr2d173A932Ye6i8Q73Qtrif8btuE0ezmxHb06T/7juO/XsVUWO4Y3Cpi4O+nVYY5EuzHTDA9tBD2uu+fvNQD0cXXEgKmbtpjfu6qEO0blt1xNZGABzAPbE7FkxqKXdApPC8D9m4S4G/FAHC/CUejmK6BTUVExy3PYTDxAC4yQoGyxohL2O/BuPBwaC/0MYHK2W6BiC97WvCwSgPPowVu+GtYACuMtXASUuBREzDR7wL+9StVmFdO/yF2AoMVTysu+GSLiC+vgDD1ANCkGXEEXm90HBzUFwyZ0wlzvDHfwyIACRDPqyk8tsFG/wHCrw6e0zErUs0cYRyQqYY/lsqs8oTEOMHgzAyBykXapjGn2G6Sgoxu4vAf2PH+4s5/7Wht9VLhIQbsRzQyMjDh4oxtEvlk4zERIzjyaA6ZlchfiIjU5ebAoNEMgAnx7fgxfBQtQTrynRLJexLUfGmGE9skrwlUl5UK4IsglkFwZcWr8FgAPHJGheEzBAhy6gTWEo0C/y2tNC8OdmqD/lAOVmjsYGGkiWMs6sFwSkHyhKwQVxwtpOjxNn2Qx5gVvY8I2nlzWx6ITqxobvcZ1U7vAu9zfrsRLclUe5jABd5KUEDDFxsznXUsYaUsQpdQgZQxSliTrFqS3WFyogkEYL8MJ+jUp+qThJwdCuAuIoM04hksJ0CKj5NC+8CCC0TUv9KcozUGQ2zxjraTsTQ0vHAyv8H8w4oVUZ8No6FYQAUewIb7LGmZSiwsCB2jMTkVQ3ULDb2ZEdfBDVycR4VBGdUycyQ3LlaSTwNWRsSUJ2rG8e9JdYLYX2igs4V4T2AjNaALC9O3Q+bwJ51jHoQNDvm1G9gJAHkSQJBy1rUWyiit9kyLKs++hzj8hZS/cUQ9kCO7SiULavj/FnlDCzR+gasCh6ETRGhjRvyUtrRU76RbTcnstpjBtAnAMeAoLVvsqk7Z7WWpyMTDNf8IK8eQGl2bTc8MpIQYgB2+wF4O70jh9yuMNubkYZX3B9L+lghbV6fbURPXY8/JAC8wtMkKIbmB96b+Vf53Bjk3WyPRdBHnN7/jjkXf2UAh5XIwrsxY0jfr+XftXHboaEPDhmBSas41u00f9LXfl15mbkxtb172Hge1KDbi9xjj6XV76K7IjDE9bQx3r0QeajMNaG9KDth0uCQIc4umWOGroMaAeDCgMDfhymPefhqvHEeFFLaNW5DqlxYXEGOOR0ApnxodRLboqcoG744jyjaM95eQy3ifZl9n7gAC5A45806N4ngc1TlwXDluAEpLQ3hIq3g22RipS0BCrDdv2Dcs7HiSIKi3ccbawwpDXbMHQznzJGIw8UNxF3g8fiUZp4fGNfhaw6GRyPSuoDmoKMVx2UuWvwH5/mUNxoTlm4ijxnpWEYrYBxx/9Pd5z6hVUcnpYlqoSDZ6NTz6Gro4c6lfZSeIz52wkfD0SWwuoI+G1LeHZ8OPHN13xDr4WUa7G+eYbxOUSaO2e4C1vih51eqmMc+6rhx602S6+xwqs3x7HbWWdGk6JmVmmmQiYS+TE6KG8vu47em5EBHUYWHt27ulOiuAbKu65+5G+dRpmNeeSUn1AkNK6EODD1RYe6dAgF6msNuH8VOG3gy5GueX0e+KbLHrku860xpZ9lNApnk8PmuIA2o6qUh2rQS8FwC2Oag8S0XZfNuRMKdAr0rAXc58g148P1C8aFRpgrM2UhixPziESMozi3QNzef7zmvev7+t6ul8pvx8P9qMK0jt+46HPPMHe1TBQD8be2xkfMU2fQo8ordbR/UK978wCipKx/k5/XXjiPgLupiDxdlqqj613YujjweMUBdTcwF0Iw4ryQ6r81zfxX2PbNSP4+wQitEryMLH9AE7fZ/sfQTP95qZupVepaDzXyFJkEd3QKtMYgjrwElH/aL8cehIU9GGOVyGPEklfcUkc9uNPNcgCkikvix4fqLYvo1dw17BoFEqoq6L/H93vmK1tosgC/4gfuYMfz8Hl8EZ3PlNoIG7oz7Puu8H6jdM8xTpS7aie7XfwuO+BEg173rV6IK+YHLfd2NzxypiwLbom+S3xTqPv7t5NS35WwfyPz/gQ0CnTiSpXl2nrqyresanDzTsvHiq7F8vf8Dg75AIYE6ljCaJbPpfEKjUidjgLySBglJruuS0AiRDblsPqPTajXB62YlrNj5YGq/4zXy+VzAfXuB1Qxy3AB6SAAECDE2flDwHdXlUVY2YUReDfgddgmKrYWKjpoZdr5ICGRiKVm62jGsIm3+nX4REta6GTg4+gYtGMmOMLwaT+0NlwjY4hiMkUZLo5k2s6gqm0weczclZ3do6Voj4g5Wex4s/rJ/BEyAt3Z3x4KXkLtwTO/vo1tLxLE3Qt48bvUEasHXwty5NwYotIv4QJiyYgWPfQOXQCELAvw+khr3j6JAixe5/2XMxlEHAYY0/LUwoCBixAAZ4p18dRDhlpUeoIEMmkakNZLgtuU0hkmgCGYrY7h8mSPVOprsIBhdZTIpnpTKaK2UIHTsmQg+PTAVQZCrpZ32nHI00DLqDJgeDDywSlNB1khI2UpZmjaFTwNkD28w63PwVsCVvK4CG5duDZiK9EakAHnOWsdN3NpLWBgxWcUcsTFt7LkrU3FPKQ/SZQACZprBwKn2XGVwOE4rPZIW2mYl6tCrXQk+2nMy7MoqJKirXRMe7uNMNis7+zO48LACsPP5a91O8myuOQpqXvmhdJoO+mbKzRV85I0+xXIPysHn99bjKZX3lX3oqTdIBDO1V/9TEfbId9FuvPVGVDOG5QfScAqlQh8r/+UB2jCioTdXgTJcUFWC7FAAXyadOaihLNoBVyE/+xHnIhIscviEh7KAiOGIM0SQ14l7+ZdUgGltoh1QMk5zIT4ZMoVjjp+1NiCGIqpHwGVD1mSjJFK25eUq2lHI5D40nibmCeJN6cSRPFr55I8cREAblzRNhGSDeDwI4QjnPWUmP06SAyVCbU7xZn0SngJVgREccKdV7/A2AAZ76tinnyRot52gTfKHJKKBVcloJ+llCZGkNGHlp6UMyAcrBgOoyaNvYX26j2kKFcfgqFDUWgKg+DjaXAQ8rEoTEZv+SauztDJ7Raf65Cr/za4KMfbrE8FmcSuxBRJQgYnJoqhitOee4C1HS1YryrX4DAZmjjsOA5dCxVIWJLl63YauvygMG1e705jaibmZsImoorLY+21zBDQw7r6/BLDwv+d26gG1+UXQcQRigOwxu2cUDAhA3JKA6X8oc1qYehGoOjGeB1/sp7oYktYxAVjStXPHpYQVUJTaLkFvfWephwCCMit7U83/BizwWB/POcjOG9hlS69HEa2BxX7FWWiBEjP9S6tPn9vjWUJRXbVLBpT8Bm/yHmd0ZDc3g2pUx5aNWQFoo5vxXR+17TZsWQNSqbZfZ9IwOc9QFi7ZffsSAODR4q3QyO7ybPjhcX8h//TQiNr9ok/6REBXnZRjtsDlNoPeSZmkFO75j3BrDaHKgLH853IcAZc6Q5BOzrojlL7eWuaaR1O77VUjjgOECa/GuF/Ln7Jk50DGbLx7NCePheOjkbL981XH7oHoo/9Xuum4nrH9gd5jZlP44Iwf1uZlnd+/DaD3Z27tm97v7pUG55WIfphJ0f3qJTgVzI4N/psgB0C3KboVRFNpwV4nNoYG4dFJSArUC18a2Lj0nYpzFKRg9BCxvrRg0CC9M4GSRCGGLY1wUjNEV0JQ2IkYHXCFQsRdF7YGQ8e4D04+xAF+RIEAO+VQL3kyIRLC1qkIxk+IWqygF16oJ65YbxhkGv8FAiIVxfpRh4rC6gAHMbS/DZhvi+djVCrOFUM+7VBYBVSIB9WAgO6dkVXgA1wPH7gCIGZRjls01SC/srspaNBmNQyF0gJZGyJ4MXlWaKPU0hBHRfZPQoaKlqV0ksc17ZFYTkygJReovlN+iI2IMOQKJLC/T4IylDnIpJ8wcClY+BKWKNCOAPqIBgT0opW1UUAdw3E5K1jRkIgsAy5zqcsXGDFtlvIlN2cFrYtFrVBv3AACIqbMS3JCAEYQ5ppEsJElNqOYagChNRVJlJOp8WlXdCIUzylFU6hTBOyEVgKYIQF4Tmie9axnDvJZM04ewphmKKM/pRMAC4wjoOHoHUH/7YPQf6xhofW0SwAdyiy1oWcUxauo2dBxUA+oUxjO8ss3C+qHj4pTgiK1pl14aVKmZAyLE0UWS+t3gOgJIKZ8SABTnfJSWnphmmSo5k4nKKGfMguih3gjAsRVVOlQIJ5JHWtSW/BUqLpBqomp6kJh0kysIimVBlwDMr/angW0EK0PlOhU2dpWHJQUruaRq0LUSk5z2hWdONWrLfgKR7+KdJfsvJ8VBCfUMvwxse1xQF4Ze7pQjNQAooXbaPG1xaz5VLBYeKBhK6lZi2LUs2h17GPlCLeCHdS0K2RUalWLAq0e4rJlWOlrWypbWtKWnizsrFl12z/E9da3JADuIVor/8LiLpO5x/2hDbWIUwk493mMnCw42bjYFwi3q8TFri8ocN7t1tKwZFDuc88C3hVGL7qqpW5E9/dE9iYIr/DV3yioOiIikmm3XZRuO2dpWRlMk6IAbk8AAPBe2Qr3DCw0pN6e18JsChal06LBkjI74c1qd8ALad4EU2yLDtvuDSA2KTQvjF6rjcG1J7boAWxMSwnIN5FzZGyL3cAF/TaQv6cyRwRYuWOwuhi+z7CW/6JMjiofQhXkNU8H3gnV4V33ydlV8RvAsA8DH+64MHZb+tZpUiU3yhwQW6+YKwdntE75TP2Tcn0PkYo4bJkOsvQxKobXzzrX5gFW/nGQFTpkPv97OJ4bDV80BbdmCJsR0RS2MJnzERT6Qk/Fl/5R3mAK6JoR1MF6Da8M6KxpX0Bg0fsUzvk6zeoCfTSg3zxpU1S96uER9dU8JnSjxhmN88n6dJF+kvrWucOaPkfNDJGcsE/kXhXneWq17vRdlv2kgyZVpmqqaVmJbWSXRCCZ1U4QM9UcA2NT2XbJvs+2OxVukjwr33tgakG5PWoOzHndJ6qwub/gKNKgOSoFj7PtiK2LcMeU3zYtKyLOe9CLY/ysXdgbIAWe6HkHwrQIfx63dSBevWYc4/b9w1glLnGyPkckt56fxwce24yB17kj9xzI6S3vkv9DBRFfE7RmOoKmRpv/Mq6uOax7XvFbN1oaJwe6xn5OdZOZWty7lgVTP8HkYDO9PT0uVM5hE/VjN/zqt07z1T2hAoo8G5oCiEHnIoDDsFNY40y8+Gh/dPZRgJrUard6278AU4Fqs8sdTjfeubQA4cUg8oWY/PP+7i6SD57nhTer+pyJai0UsyXEa/yQAnCBaZ/P8qEIfIGc7nPDub5TRw4ftDQGM9JzyQGs75/q17D75sSeQIYjQPDPMuOn0SoBS8N9ggLQgITPqfeOhn3b//256qsz0JmYwNKZD+vf2076QdT81a3fs+IrxM1qTECYvd8eBYB/+IiJP13QLzaeL/xU2TdpBrrvfkdQgByJ/98HYR7Vrd35UZ2WmVQCdNz/ScfjadEAokEBAt0B1h/QnZpDKZ8D3kkAVAD0ZQlpTF0FEh6ZIRkhNSAH1obuCZEEalgJclvl2V/iwFUCgJ0KUtgB0N+P7Bz1AZ35UcZU5V9DCRb34eCdUMAOjkgPGo4BPo8ZcJFsqVYCqNsRDgn8rRC8sVjaldz5TOAQqoDn/VQCFID/WeHxXAAI5sv8eRuZAWHPqEEUGpJvMeAZSsoDKKGxiOAIYlvlgZa5NVLyLJ8dDhwA5GHk7CEMbtcbqk6BuR4+hZgZEqIjQMAhwiFiqKE5gGEOWGAQsth5BdYYtt8kJogO+o8LmoElmsMMBv9C6vFD6iCUAhahJJJiI1BAJrpEcPTZdvHepxUCCokhViXAodXiiSwAAviPFkYDLuICpD2PMl6e3oWOdJVhMUqKBzIjIUAj4PnPcXUibATHXIzWxV2DdNWhNd6hKuICKqYiljEWIyIiG84Az0TeCb6ODaLjqjhfNtLJNkoDPzYEWsHjGsqjnEmA9gkUrXATA3DT1iUBLeZjI1Si3/0Mk6gjQ7DiQF4iJkYFOF2KyjBkMrBfRCaLKUZORebKChnSN+phIpqDB2zZADwSFchB/5GkPk6bGPgjE16TfbFkcwQH+PHQTEZBLBDjTRrjx/gMSg5MHOLXe/3kw4TjtMHkSRH/5RQUAFImiwciQFP+oxYhWN5sEXfgkj1Gwh3dAQNApFY2ggN0pVeiHVii0H1t0U6u3rQd5AXlxA2y5cA1wFvCZXcpkmjRUdkpEnf8nlnOwVVCkhH25apQAGAGJmiNVCGU1jyCkl2GwicZwKYwph1U4WPeiQJI5mSOX1UBZAgG5bSFYknkBANUo2jqo2kWGGRZk2auQVnmEVrySQrKZoI8QGnS5gvapgDmx9tACG+m5SD+Jpdw5XBOX3GuEDvyD0NUpahwxVo2p0QKJ3T2lXSuUIXoZra85ihu58AdQHd6J3hSEG76XkcOBvUcg02eZ7JEpnc6JXv6YX7gUmeS50kw/8BR1ucVqid0XqR+hkGF/F4bzJB86kRsDqg+XkCBDueBIih19hVhYlzfzWNrVkRSMIBvRihwUmiFImj0HUbqdBZdKuaagChfjmjp/SV+nuaJml1pWJkExEt2xui+QECJmqiNxmNQEF+hHF98vGZo9qikpCeN1qiQruNYzNuRRsJnFiV9LulWOml0QmkNSGAEgCJHJYWAZumQHOOWpkGXGkh3eIeYOgiElqk+VgCQ2lC2yUhqKpJ7ogl6tKgJKKcUqGWcToxbWgjuzN2nWKhxCsWe8ukRZRCMCqqM0ik1haUK0BZPgqd7bgCj8mnv/CkUOGakkst9Xl70aOoWgicqvv9Lo7KPQSipqEoKaXrSLwJChpFlcYICWRAaJNrDp34GnMIqZJaBilZqrQ4MnlIkYhQfQDiqQZBpsA7JA8ghPmDoMi5Urh4GodhXnybBPDAntF4jANzHqb4isk5bfpjbKHFNN2gnuDbdfQSmzlAQtoYjLVEpHRiEebqrc45doJim81Akua7BDN7rYhoDA2Dpvo7qe8mTgSplzyxlrmhrxuyoTryqwsbqhV1qvCaGyIyBwJ4JWsXng7Yrxh7PnblAtaKprqJVIM4CY4aoyTKNosHIyhqoQHJrt1YCA0CqzDrnzfmEytrsjOiVh36IK5Ssz1Ji7Ant0EoDKwodb8wkBuj/q9LeyVF1StM67ShAbRiObB4krNWSSwAIzsZuLXdsYs7qLHk8q9g6XvDZ6tkGxyYa7YfaAbC67VZy2qzJraDQ7fTAgojmbe4tK8j27VB4lstuiBT07ODy67Jq7eFuIrMmZxSEquNODAXYX9we7kdsotdWLhVcLOauigLYny11bs587iv10meELemObf4gTeqSRUt07QoU7CrIQ8zCbtkIGC3ZKe3GWyEcFynByrf2rt4OodkK73xhye0+R92WRNIm77sKZOTS5vasLlowCz5Wb9kEQL/imeEGaS7IlroOxuV+b+ZC712QL1z+Xvu+3SlR4fpSjul6Y46lbuG0RP8CTtz/ru5bpQUZUq/9Hg8AIHACK/ACM3ADO/ADV0AES/AEU3AFW/AFY3AGa3AFAEAEd7AHS/AHc/ADk3AJm/AEoHAKq/AKs3ALo7Dgel8IAAA7')
    },
    brick: {
      opacity: 0.9,
      stroke: '#c67941',
      strokeWidth: 4,
      bgcolor: '#c67941',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfAGwWAnsjB/38/MunnoUrEZZKNebW0axuXI0yFpQ1GVoDAH8nDLd5Zvbw7pJXT76TiLWDdnUtJNe7tODKxYg/KpUwEPDm46FlU+zf26dYP6FuamALAHUgBJs7HYYsEv///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmUzYTUzMDZlLWI4ZjAtNGM4Mi05MDExLTZiYTMwY2M3MjUwOSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5QkNEMDhBQzE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxMkY1OTMxNDE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpkZjNiN2M4ZC1jNmIxLTRlOWQtOTAyMy04Njk1NWUyMjQ1NzUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZTNhNTMwNmUtYjhmMC00Yzgy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')
    },
    wool: {
      opacity: 0.9,
      stroke: '#94c643',
      strokeWidth: 4,
      bgcolor: '#94c643',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfAPj41p7W3Pz9+Y+xW4iqPcrSS/Xzt9/cVa3DbZq6LH2hN+jkdOzpipfKuJKyNbPGPtTv+sPTh6C+LuXgXdjgnePptvLwrY+7ifDtnM3ctqLd9OLeWp68LoGkPvb0u////yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmMzNDUyNjY2LTIzM2EtNDA3OC04ZGE5LWY2ZDc1NGE2MjIxNCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5QkNEMDhCMDE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5QkNEMDhBRjE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpjMmU0NjI3ZS03MjJkLTRlMGUtYTY5NS0wYjAwOGU5NzU2YjMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6YzM0NTI2NjYtMjMzYS00MDc4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')
    },
    grain: {
      opacity: 0.9,
      stroke: '#e7a93a',
      strokeWidth: 4,
      bgcolor: '#e7a93a',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfAPSiSKlHKf758fnjrvrdbtCOSfa1WeeVRcRuOfbJYt2IQf3icPbCh7lfM+OyWvfBXN+5rPeqTs19P/jVadqgUvTQaLlpTevAYPjQZfnYZfrghsyQeq1NLPnabPSlS////yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmZlOTgyZTk5LWEwYjctNGExZS1hNzlkLWRlMDAzNWI2MTg0YyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5QkNEMDhCNDE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5QkNEMDhCMzE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxZjk0MDY0My1kMDY0LTRhYjgtYTgwMi05YTY2ZGQ4NTI3NTMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZmU5ODJlOTktYTBiNy00YTFl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')
    },
    ore: {
      opacity: 0.9,
      stroke: '#a5b29e',
      strokeWidth: 4,
      bgcolor: '#a5b29e',
      bgimage: image('data:image/gif;base64,R0lGODlhkAFaAcQfAHRvav7+/ero5o6Lg9vY1PTz8qijm2ZhXYeDfbOtpMvHwWFcV7mwpsK7s8bCvLq4ttDMx62oodXRzJuYj6GelZCOhOXi3396deDd2e/t7Pj4942JgpSShry0qmlkYP///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmJkNzFiMDE4LWQ3OWEtNDhkMi1iMjdhLWFlZDdkYWMyZWFjYiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCQjVCQURENzE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCQjVCQURENjE5MzgxMUU0QTcwNkMwMUJGODg3QjgxNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyYzEwMTY1OC0wOTUwLTRjMmItOWFhOS0yMDNmYTgyZTQ4YmEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6YmQ3MWIwMTgtZDc5YS00OGQy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')
    }
  }
};

},{}],33:[function(require,module,exports){
'use strict';

var ko = require('knockout'),
    ViewActions = require('./view-actions'),
    RootViewModel = require('./model/index');

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

function UserInterface(socket, emitterQueue, notifications, factory) {

  this.onBoardClick = this.onBoardClick.bind(this);
  this.onBuildSettlement = this.onBuildSettlement.bind(this);
  this.onBuildRoad = this.onBuildRoad.bind(this);
  this.onTurnEnd = this.onTurnEnd.bind(this);
  this.onTurnStart = this.onTurnStart.bind(this);

  this.game = null;
  this.socket = socket;
  this.emitterQueue = emitterQueue;

  this.viewModel = new RootViewModel({
    actions: new ViewActions(socket),
    emitterQueue: emitterQueue,
    notifications: notifications,
    factory: factory
  });

  this.viewModel.ui = {
    buttons: ko.observable(false)
  };
  this.viewModel.events = {
    onBuildRoad: this.onBuildRoad,
    onBuildSettlement: this.onBuildSettlement
  };

  this.viewModel.subscribe('myTurn', function(myTurn) {
    if (myTurn) {
      return this.onTurnStart();
    } else {
      return this.onTurnEnd();
    }
  }.bind(this));

  this.socket.on('room_users', function(users) {
    this.viewModel.users = users;
  }.bind(this));
}

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
  var ownedCorners,
      ownedEdges;

  if (this.game.phase === 'setup') {
    ownedCorners = this.game.board.corners.query({
      owner: this.game.currentPlayer
    });
    ownedEdges = this.game.board.edges.query({
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

UserInterface.prototype.onBoardClick = function(data) {
  if (!this.viewModel.myTurn) {
    return;
  }
  if (this.game.phase === 'setup') {
    this.game.hideBuildableEntities();
    this.socket.emit('Build', {
      buildType: data.type,
      buildId: data.id
    });
    if (data.type === 'corner') {
      this.game.showBuildableEdges(data.id);
    }
  } else {
    this.game.hideBuildableEntities();
    this.socket.emit('Build', {
      buildType: data.type,
      buildId: data.id
    });
  }
};

module.exports = UserInterface;

},{"./components/alert":3,"./components/build-modal":5,"./components/menu":9,"./components/player":11,"./components/players":13,"./components/stage":14,"./components/trade-modal":16,"./model/index":27,"./view-actions":34,"knockout":undefined}],34:[function(require,module,exports){
'use strict';

function ViewActions(socket) {
  this.socket = socket;

  this.endTurn = this.endTurn.bind(this);
  this.offerTrade = this.offerTrade.bind(this);
}

ViewActions.prototype.endTurn = function() {
  this.socket.emit('EndTurn');
};

ViewActions.prototype.offerTrade = function(resources) {
  this.socket.emit('OfferTrade', {
    resources: resources
  });
};

module.exports = ViewActions;

},{}],35:[function(require,module,exports){
'use strict';

module.exports = {
  EmitterQueue: require('./lib/emitter-queue'),
  GameCoordinator: require('./lib/game-coordinator'),
  GameSerializer: require('./lib/game-serializer'),
  MathHelper: require('./lib/math-helper'),
  Board: require('./lib/board'),
  Game: require('./lib/game'),
  HexCorner: require('./lib/hex-corner'),
  HexEdge: require('./lib/hex-edge'),
  HexTile: require('./lib/hex-tile'),
  Player: require('./lib/player'),
  util: require('./lib/util')
};

},{"./lib/board":37,"./lib/emitter-queue":41,"./lib/game":44,"./lib/game-coordinator":42,"./lib/game-serializer":43,"./lib/hex-corner":45,"./lib/hex-edge":46,"./lib/hex-tile":47,"./lib/math-helper":48,"./lib/player":49,"./lib/util":50}],36:[function(require,module,exports){
'use strict';

function BoardEntity(factory, options) {
  factory.defineProperties(this, {
    center: options.center,
    board: null
  });
}

BoardEntity.spatialQuery = function(callback) {
  return function() {
    if (this.board) {
      return this.board.spatialQuery(callback.bind(this));
    } else {
      return [];
    }
  };
};

module.exports = BoardEntity;

},{}],37:[function(require,module,exports){
'use strict';

var collections = require('./collections/hex-collections');

function Board(factory, options) {
  factory.defineProperties(this, {
    height: options.height,
    width: options.width,
    hexInfo: options.hexInfo,
    game: null
  });

  this.width = options.width;
  this.height = options.height;
  this.hexInfo = options.hexInfo;
  this.game = null;

  this.corners = new collections.HexCornerCollection();
  this.edges = new collections.HexEdgeCollection();
  this.tiles = new collections.HexTileCollection();

  this.addEdge = this.addEdge.bind(this);
  this.addCorner = this.addCorner.bind(this);
  this.addTile = this.addTile.bind(this);
}

Board.prototype.spatialQuery = function(optionsFunc) {
  var options = optionsFunc.bind(this)(this);
  return options.collection.query({
    within: { radius: options.radius, of: options.center }
  });
};

Board.prototype.addTiles = function(tiles) {
  tiles.forEach(this.addTile);
};

Board.prototype.addCorners = function(corners) {
  corners.forEach(this.addCorner);
};

Board.prototype.addEdges = function(edges) {
  edges.forEach(this.addEdge);
};

Board.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  tile.addToBoard(this);
};

Board.prototype.addCorner = function(corner) {
  this.corners.push(corner);
  corner.board = this;
};

Board.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  edge.board = this;
};

module.exports = Board;

},{"./collections/hex-collections":38}],38:[function(require,module,exports){
'use strict';

var QueryableCollection = require('./queryable-collection'),
    clauses = require('./query-clauses'),
    util = require('./../util');

function HexCornerCollection() {
  QueryableCollection.call(this, [
    clauses.owner,
    clauses.within,
    clauses.exclude,
    clauses.buildable,
    clauses.settlement,
    clauses.city
  ]);
}

function HexEdgeCollection() {
  QueryableCollection.call(this, [
    clauses.owner,
    clauses.within,
    clauses.exclude,
    clauses.buildable
  ]);
}

function HexTileCollection() {
  QueryableCollection.call(this, [
    clauses.within,
    clauses.exclude,
    clauses.value
  ]);
}

util.inherits(HexCornerCollection, QueryableCollection);
util.inherits(HexEdgeCollection, QueryableCollection);
util.inherits(HexTileCollection, QueryableCollection);

module.exports = {
  HexCornerCollection: HexCornerCollection,
  HexEdgeCollection: HexEdgeCollection,
  HexTileCollection: HexTileCollection
};

},{"./../util":50,"./query-clauses":39,"./queryable-collection":40}],39:[function(require,module,exports){
'use strict';

var MathHelper = require('./../math-helper');

module.exports = {

  owner: {
    valid: function(options) {
      return options.owner || options.player;
    },
    filter: function(options, items) {
      var player = options.owner || options.player,
          playerId = typeof player === 'string' ? player : player.id;

      return items.filter(function(item) {
        return item.owner === playerId;
      });
    }
  },

  exclude: {
    valid: function(options) {
      return options.exclude;
    },
    filter: function(options, items) {
      var excludes = Array.isArray(options.exclude) ?
            options.exclude : [options.exclude];

      return items.filter(function(item) {
        return excludes.indexOf(item.id) === -1;
      });
    }
  },

  within: {
    valid: function(options) {
      return options.within;
    },
    filter: function(options, items) {
      var radius = options.within.radius,
          origin = options.within.of;

      return items.filter(function(item) {
        var distance = MathHelper.getDistance(origin, item.center);
        return distance < radius;
      });
    }
  },

  buildable: {
    valid: function(options) {
      return options.buildable === true || options.buildable === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isBuildable === options.buildable;
      });
    }
  },

  settlement: {
    valid: function(options) {
      return options.settlement === true || options.settlement === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isSettlement === options.settlement;
      });
    }
  },

  city: {
    valid: function(options) {
      return options.city === true || options.city === false;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.isCity === options.city;
      });
    }
  },

  value: {
    valid: function(options) {
      return options.value;
    },
    filter: function(options, items) {
      return items.filter(function(item) {
        return item.value === options.value;
      });
    }
  }

};

},{"./../math-helper":48}],40:[function(require,module,exports){
'use strict';

var _ = require('underscore');

function QueryableCollection(clauses) {
  this.items = [];
  this.clauses = clauses;
}

QueryableCollection.prototype.push = function(item) {
  if (Array.isArray(item)) {
    this.items.push.apply(this, item);
  } else {
    this.items.push(item);
  }
};

QueryableCollection.prototype.forEach = function(callback, thisArg) {
  this.items.forEach(callback, thisArg);
};

QueryableCollection.prototype.map = function(map, thisArg) {
  return this.items.map(map, thisArg);
};

QueryableCollection.prototype.filter = function(filter, thisArg) {
  return this.items.filter(filter, thisArg);
};

QueryableCollection.prototype.all = function() {
  return this.items;
};

QueryableCollection.prototype.getById = function(id) {
  return _.find(this.items, function(item) {
    return item.id === id;
  });
};

QueryableCollection.prototype.query = function(options) {
  var q = this.items;

  this.clauses.forEach(function(clause) {
    if (clause.valid(options)) {
      q = clause.filter(options, q);
    }
  });

  return q;
};

module.exports = QueryableCollection;

},{"underscore":undefined}],41:[function(require,module,exports){
'use strict';

var async = require('async');

function EmitterQueue(source) {
  this.source = source;
  this.processTask = this.processTask.bind(this);
  this.queue = async.queue(this.processTask, 1);
}

EmitterQueue.prototype.getTasks = function(event, data) {
  var listeners;

  this.callbacks = this.callbacks || {};

  listeners = this.callbacks[event] || [];
  listeners = listeners.slice(0);

  return listeners.map(function(listener) {
    return function(next) {
      listener(data, function() {
        // next function must be called asynchronously
        // this allows us to write synchronous callbacks
        setTimeout(next, 0);
      });
    };
  });
};

EmitterQueue.prototype.processTask = function(task, next) {
  var tasks = this.getTasks(task.event, task.data);
  async.series(tasks, function() {
    // next function must be called asynchronously
    // this allows us to write synchronous callbacks
    setTimeout(next, 0);
  });
};

EmitterQueue.prototype.emit = function(event, data) {
  var task = {
    event: event,
    data: data
  };
  this.queue.push(task);
};

EmitterQueue.prototype.on = function(event, fn) {
  this.callbacks = this.callbacks || {};

  if (this.callbacks[event] == null) {
    this.callbacks[event] = [];
    this.source.on(event, function(data) {
      return this.emit(event, data);
    }.bind(this));
  }

  this.callbacks[event].push(fn);
};

EmitterQueue.prototype.onceDrain = function(fn) {
  var onDrain = function() {
    this.queue.drain = null;
    fn();
  }.bind(this);
  this.queue.drain = onDrain;
};

EmitterQueue.prototype.kill = function() {
  this.queue.kill();
};

module.exports = EmitterQueue;

},{"async":undefined}],42:[function(require,module,exports){
'use strict';

function GameCoordinator(emitterQueue, game) {
  this.emitterQueue = emitterQueue;
  this.game = game;

  this.onDistributeResources = this.onDistributeResources.bind(this);
  this.onBuild = this.onBuild.bind(this);
  this.onNextTurn = this.onNextTurn.bind(this);
  this.onOfferTrade = this.onOfferTrade.bind(this);

  this.emitterQueue.on('NextTurn', this.onNextTurn);
  this.emitterQueue.on('Build', this.onBuild);
  this.emitterQueue.on('DistributeResources', this.onDistributeResources);
  this.emitterQueue.on('OfferTrade', this.onOfferTrade);
}

GameCoordinator.prototype.setGame = function(game) {
  this.game = game;
};

GameCoordinator.prototype.onNextTurn = function(data, next) {
  var turn = this.game.turn + 1;
  this.game.setTurn(turn);
  next();
};

GameCoordinator.prototype.onBuild = function(data, next) {
  var corner, edge, player;
  player = this.game.getPlayerById(data.playerId);
  if (data.buildType === 'corner') {
    corner = this.game.board.corners.getById(data.buildId);
    corner.build(player);
    player.addVictoryPoint();
    if (this.game.phase !== 'setup') {
      player.spend({
        lumber: 1,
        brick: 1,
        wool: 1,
        grain: 1
      });
    }
  } else if (data.buildType === 'edge') {
    edge = this.game.board.edges.getById(data.buildId);
    edge.build(player);
    if (this.game.phase !== 'setup') {
      player.spend({
        lumber: 1,
        brick: 1
      });
    }
  }
  next();
};

GameCoordinator.prototype.onDistributeResources = function(data, next) {
  var player, playerId, resources;
  for (playerId in data) {
    resources = data[playerId];
    player = this.game.getPlayerById(playerId);
    player.distribute(resources);
  }
  next();
};

GameCoordinator.prototype.onOfferTrade = function(data, next) {
  this.game.offerTrade(data);
  next();
};

module.exports = GameCoordinator;

},{}],43:[function(require,module,exports){
'use strict';

var _ = require('underscore');

function GameSerializer(factory) {
  this.factory = factory;
}

GameSerializer.prototype.serialize = function(game) {
  var board = this.serializeBoard(game.board),
      players = game.players.map(this.serializePlayer, this),
      result = {};

  result.board = board;
  result.players = players;

  result.allowance = game.allowance;
  result.turn = game.turn;

  if (game.currentTrade) {
    result.currentTrade = game.currentTrade;
  }

  return result;
};

GameSerializer.prototype.deserialize = function(data) {
  var game = this.factory.createGame({
    board: this.deserializeBoard(data.board),
    players: data.players.map(this.deserializePlayer, this),
    turn: data.turn || 0,
    allowance: data.allowance,
    currentTrade: data.currentTrade
  });

  this.deserializeBuildings(game.board, data.board, game.players);

  return game;
};

GameSerializer.prototype.serializePlayer = function(player) {
  return {
    id: player.id,
    resources: {
      total: player.resources.total,
      brick: player.resources.brick,
      grain: player.resources.grain,
      lumber: player.resources.lumber,
      ore: player.resources.ore,
      wool: player.resources.wool
    },
    developmentCards: {
      total: player.developmentCards.total
    },
    victoryPoints: {
      public: player.victoryPoints.public,
      actual: player.victoryPoints.actual
    },
    knightsPlayed: player.knightsPlayed,
    longestRoad: player.longestRoad
  };
};

GameSerializer.prototype.deserializePlayer = function(data) {
  var player = this.factory.createPlayer({
        id: data.id
      }),
      propName;

  if (data.resources != null) {
    for (propName in data.resources) {
      player.resources[propName] = data.resources[propName];
    }
  }
  if (data.developmentCards != null) {
    for (propName in data.developmentCards) {
      player.developmentCards[propName] = data.developmentCards[propName];
    }
  }
  if (data.victoryPoints != null) {
    for (propName in data.victoryPoints) {
      player.victoryPoints[propName] = data.victoryPoints[propName];
    }
  }
  if (data.knightsPlayed != null) {
    player.knightsPlayed = data.knightsPlayed;
  }
  if (data.longestRoad != null) {
    player.longestRoad = data.longestRoad;
  }
  return player;
};

GameSerializer.prototype.serializeBoard = function(board) {
  var tiles,
      corners,
      edges;

  tiles = board.tiles.map(function(tile) {
    return {
      id: tile.id,
      center: tile.center,
      type: tile.type,
      value: tile.value
    };
  });

  corners = board.corners.map(function(corner) {
    var result = {
      id: corner.id,
      center: corner.center
    };
    if (corner.owner) {
      result.owner = corner.owner;
    }
    return result;
  });

  edges = board.edges.map(function(edge) {
    var result = {
      id: edge.id,
      center: edge.center,
      ends: edge.ends
    };
    if (edge.owner) {
      result.owner = edge.owner;
    }
    return result;
  });

  return {
    hex: board.hexInfo,
    height: board.height,
    width: board.width,
    tiles: tiles,
    corners: corners,
    edges: edges
  };
};

GameSerializer.prototype.deserializeBoard = function(data) {
  var board,
      tiles,
      corners,
      edges;

  board = this.factory.createBoard({
    height: data.height,
    width: data.width,
    hexInfo: data.hex
  });

  tiles = data.tiles.map(function(tile) {
    return this.factory.createHexTile({
      id: tile.id,
      center: tile.center,
      type: tile.type,
      value: tile.value,
      hexInfo: data.hex
    });
  }, this);

  corners = data.corners.map(function(corner) {
    return this.factory.createHexCorner({
      id: corner.id,
      center: corner.center,
      hexInfo: data.hex
    });
  }, this);

  edges = data.edges.map(function(edge) {
    return this.factory.createHexEdge({
      id: edge.id,
      center: edge.center,
      ends: edge.ends,
      hexInfo: data.hex
    });
  }, this);

  board.addTiles(tiles);
  board.addCorners(corners);
  board.addEdges(edges);

  return board;
};

GameSerializer.prototype.deserializeBuildings = function(board, data, players) {
  data.corners.forEach(function(corner) {
    var player,
        hexCorner;

    if (corner.owner) {
      player = _.find(players, function(player) {
        return player.id === corner.owner;
      });
      hexCorner = board.corners.getById(corner.id);
      hexCorner.build(player);
    }
  });

  data.edges.forEach(function(edge) {
    var player,
        hexEdge;

    if (edge.owner) {
      player = _.find(players, function(player) {
        return player.id === edge.owner;
      });
      hexEdge = board.edges.getById(edge.id);
      hexEdge.build(player);
    }
  });
};

module.exports = GameSerializer;

},{"underscore":undefined}],44:[function(require,module,exports){
'use strict';

var _ = require('underscore');

function Game(factory, options) {
  factory.defineProperties(this, {
    board: options.board,
    players: options.players,
    allowance: options.allowance,
    currentTrade: options.currentTrade || null,
    turn: null,
    phase: null,
    currentPlayer: null
  });

  this.board.game = this;
  this.setTurn(options.turn || 0);
}

Game.prototype.offerTrade = function(options) {
  this.currentTrade = {
    owner: options.playerId,
    resources: options.resources
  };
};

Game.prototype.setTurn = function(turn) {
  var data = this.getDataForTurn(turn);
  this.turn = data.turn;
  this.phase = data.phase;
  this.currentPlayer = this.players[data.playerIndex] || null;
};

Game.prototype.getPlayerById = function(id) {
  return _.find(this.players, function(player) {
    return player.id === id;
  });
};

Game.prototype.getDataForTurn = function(turn) {
  var phase = 'waiting',
      playerIndex = null,
      prevTurn;

  if (turn > 0) {
    prevTurn = turn - 1;
    if (turn <= this.players.length * 2) {
      phase = 'setup';
      if (turn <= this.players.length) {
        playerIndex = prevTurn % this.players.length;
      } else {
        playerIndex =
          this.players.length - 1 - (prevTurn % this.players.length);
      }
    } else {
      phase = 'playing';
      playerIndex = prevTurn % this.players.length;
    }
  }

  return {
    turn: turn,
    phase: phase,
    playerIndex: playerIndex,
    playerId: playerIndex != null ? this.players[playerIndex].id : null
  };
};

Game.prototype.getBuildableEdgesForCurrentPlayer = function(cornerId) {
  return this.getBuildableEdgesForPlayer(this.currentPlayer, cornerId);
};

Game.prototype.getBuildableCornersForCurrentPlayer = function() {
  return this.getBuildableCornersForPlayer(this.currentPlayer);
};

Game.prototype.getBuildableEdgesForPlayer = function(player, cornerId) {
  var corner,
      ownedCorners,
      edges;

  if (this.phase === 'setup') {
    if (cornerId != null) {
      corner = this.board.corners.getById(cornerId);
    } else {
      ownedCorners = this.board.corners.query({
        owner: this.currentPlayer
      });

      corner = _.find(ownedCorners, function(corner) {
        var edges = corner.getAdjacentEdges();
        return _.every(edges, function(edge) {
          return edge.isBuildable;
        });
      });
    }
    return corner ? corner.getAdjacentEdges() : [];
  } else {
    edges = this.board.edges.query({
      owner: this.currentPlayer
    });

    return _.chain(edges)
      .map(function(edge) {
        return edge.getAdjacentEdges();
      })
      .flatten(true)
      .uniq(function(edge) {
        return edge.id;
      })
      .filter(function(edge) {
        return edge.isBuildable;
      })
      .value();
  }
};

Game.prototype.getBuildableCornersForPlayer = function(player) {
  var edges;

  if (this.phase === 'setup') {
    return this.board.corners.query({
      buildable: true
    });
  } else {
    edges = this.board.edges.query({
      owner: player
    });

    return _.chain(edges)
      .map(function(edge) {
        return edge.getAdjacentCorners();
      })
      .flatten(true)
      .uniq(function(corner) {
        return corner.id;
      })
      .filter(function(corner) {
        return corner.isBuildable;
      })
      .value();
  }
};

module.exports = Game;

},{"underscore":undefined}],45:[function(require,module,exports){
'use strict';

var BoardEntity = require('./board-entity'),
    spatialQuery = BoardEntity.spatialQuery,
    util = require('./util');

function HexCorner(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    owner: null,
    isBuildable: true,
    buildType: null,
    isSettlement: this.isSettlement,
    isCity: this.isCity
  });
}

util.inherits(HexCorner, BoardEntity);

HexCorner.prototype.isSettlement = function() {
  return this.owner && this.buildType === 'settlement';
};

HexCorner.prototype.isCity = function() {
  return this.owner && this.buildType === 'city';
};

HexCorner.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

HexCorner.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

HexCorner.prototype.getAdjacentEdges = spatialQuery(function(board) {
  return {
    collection: board.edges,
    radius: board.hexInfo.circumradius * 0.6,
    center: this.center
  };
});

HexCorner.prototype.build = function(player) {
  var corners = this.getAdjacentCorners();

  this.owner = player.id;
  this.isBuildable = false;
  this.buildType = 'settlement';

  corners.forEach(function(corner) {
    corner.isBuildable = false;
  });
};

module.exports = HexCorner;

},{"./board-entity":36,"./util":50}],46:[function(require,module,exports){
'use strict';

var BoardEntity = require('./board-entity'),
    spatialQuery = BoardEntity.spatialQuery,
    util = require('./util');

function HexEdge(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    ends: options.ends,
    owner: null,
    isBuildable: true
  });
}

util.inherits(HexEdge, BoardEntity);

HexEdge.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 0.6,
    center: this.center
  };
});

HexEdge.prototype.getAdjacentEdges = spatialQuery(function(board) {
  return {
    collection: board.edges,
    radius: board.hexInfo.apothem * 1.1,
    center: this.center
  };
});

HexEdge.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.apothem * 1.1,
    center: this.center
  };
});

HexEdge.prototype.build = function(player) {
  this.owner = player.id;
  this.isBuildable = false;
};

module.exports = HexEdge;

},{"./board-entity":36,"./util":50}],47:[function(require,module,exports){
'use strict';

var BoardEntity = require('./board-entity'),
    spatialQuery = BoardEntity.spatialQuery,
    util = require('./util');

function HexTile(factory, options) {
  BoardEntity.apply(this, arguments);

  factory.defineProperties(this, {
    id: options.id,
    type: options.type,
    value: options.value,
    isResource: this.isResource
  });
}

util.inherits(HexTile, BoardEntity);

HexTile.prototype.isResource = function() {
  return this.type !== 'sea' && this.type !== 'desert';
};

HexTile.prototype.addToBoard = function(board) {
  this.board = board;
};

HexTile.prototype.getAdjacentTiles = spatialQuery(function(board) {
  return {
    collection: board.tiles,
    radius: board.hexInfo.apothem * 2.1,
    center: this.center
  };
});

HexTile.prototype.getAdjacentCorners = spatialQuery(function(board) {
  return {
    collection: board.corners,
    radius: board.hexInfo.circumradius * 1.1,
    center: this.center
  };
});

module.exports = HexTile;

},{"./board-entity":36,"./util":50}],48:[function(require,module,exports){
'use strict';

function round(number, dp) {
  var dp2 = Math.pow(10, dp);
  return Math.round(number * dp2) / dp2;
}

function getAngle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getEndpoint(origin, angle, distance) {
  var radians = angle * Math.PI / 180;
  return {
    x: round(origin.x + distance * Math.sin(radians), 3),
    y: round(origin.y + distance * Math.cos(radians), 3)
  };
}

module.exports = {
  getAngle: getAngle,
  getDistance: getDistance,
  getEndpoint: getEndpoint,
  round: round
};

},{}],49:[function(require,module,exports){
'use strict';

function Resources(factory) {
  factory.defineProperties(this, {
    total: 0,
    brick: 0,
    grain: 0,
    lumber: 0,
    ore: 0,
    wool: 0
  });
}

function DevelopmentCards(factory) {
  factory.defineProperties(this, {
    total: 0
  });
}

function VictoryPoints(factory) {
  factory.defineProperties(this, {
    public: 0,
    actual: 0
  });
}

function Player(factory, options) {
  factory.defineProperties(this, {
    id: options.id,
    resources: new Resources(factory),
    developmentCards: new DevelopmentCards(factory),
    victoryPoints: new VictoryPoints(factory),
    knightsPlayed: 0,
    longestRoad: 0
  });
}

Player.prototype.hasResources = function(resources) {
  var value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    if (this.resources[resource] < value) {
      return false;
    }
  }

  return true;
};

Player.prototype.distribute = function(resources) {
  var total = 0,
      value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    total += value;
    this.resources[resource] += value;
  }

  this.resources.total += total;
  this.longestRoad = 0;
};

Player.prototype.spend = function(resources) {
  var total = 0,
      value,
      resource;

  for (resource in resources) {
    value = resources[resource];
    total -= value;
    this.resources[resource] -= value;
  }

  this.resources.total -= total;
};

Player.prototype.addVictoryPoint = function(devCard) {
  if (devCard) {
    this.victoryPoints.public++;
  }
  this.victoryPoints.actual++;
};

module.exports = Player;

},{}],50:[function(require,module,exports){
'use strict';

var inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

module.exports = {
  inherits: inherits
};

},{}]},{},[1])
//@ sourceMappingURL=room.js.map.json
