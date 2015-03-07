(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('jquery-plugins');

var jquery = require('jquery'),
    io = require('socket.io-client'),
    core = require('colonizers-core'),
    Factory = require('./game/factory'),
    Notifications = require('./notifications'),
    UserInterface = require('./user-interface');

jquery.get('/tilesets/modern.json', function(tileset) {

  var factory = new Factory(tileset),
      socket = io(),
      gameSerializer = new core.GameSerializer(factory),
      emitterQueue = new core.EmitterQueue(socket),
      gameCoordinator = new core.GameCoordinator(emitterQueue),
      notifications = new Notifications(emitterQueue),
      ui = new UserInterface({
        socket: socket,
        emitterQueue: emitterQueue,
        notifications: notifications,
        factory: factory
      }),
      game = null;

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

});

},{"./game/factory":18,"./notifications":29,"./user-interface":32,"colonizers-core":46,"jquery":undefined,"jquery-plugins":undefined,"socket.io-client":undefined}],2:[function(require,module,exports){
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
  this.resetAllowances = this.resetAllowances.bind(this);
  this.resetCanBuildProps = this.resetCanBuildProps.bind(this);
  this.onDistributeResources = this.onDistributeResources.bind(this);
  this.onBuild = this.onBuild.bind(this);

  this.roomModel = roomModel;

  observableProps.defineProperties(this, {
    allowanceRoads: 0,
    allowanceSettlements: 0,
    allowanceCities: 0,
    canBuildRoad: false,
    canBuildSettlement: false,
    canBuildCity: false
  });

  roomModel.subscribe('thisPlayer', this.resetAllowances);
  roomModel.subscribe('game', this.resetAllowances);
  roomModel.emitterQueue.on('DistributeResources', this.onDistributeResources);
  roomModel.emitterQueue.on('Build', this.onBuild);
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
      cornerSettlements,
      roads,
      settlements,
      cities;

  this.canBuildRoad = false;
  this.canBuildSettlement = false;
  this.canBuildCity = false;

  if (game && player && player.hasResources) {

    edges = game.getBuildableEdgesForPlayer(player);
    corners = game.getBuildableCornersForPlayer(player);
    cornerSettlements = game.getSettlementsForPlayer(player);

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

    cities = this.allowanceCities > 0 &&
             cornerSettlements.length > 0 &&
             player.hasResources({
               ore: 3,
               grain: 2
             });

    this.canBuildCity = cities;
  }
};

BuildModalModel.prototype.onDistributeResources = function(data, next) {
  this.resetCanBuildProps();
  next();
};

BuildModalModel.prototype.onBuild = function(data, next) {
  var thisPlayer = this.roomModel.thisPlayer;

  if (thisPlayer) {
    if (thisPlayer.id === data.playerId) {
      if (data.buildType === 'road') {
        this.allowanceRoads = this.allowanceRoads - 1;
      }
      if (data.buildType === 'settlement') {
        this.allowanceSettlements = this.allowanceSettlements - 1;
      }
      if (data.buildType === 'city') {
        this.allowanceSettlements = this.allowanceSettlements + 1;
        this.allowanceCities = this.allowanceCities - 1;
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
  $('#buildModal').modal('hide');
  this.roomModel.game.showBuildableCities();
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
    die: 'data:image/gif;base64,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',
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
  template: '<div class="canvas-konva" data-bind="stageInternal: game"></div>'
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
    Konva = require('konva'),
    core = require('colonizers-core'),
    Board = core.Board;

function UiBoard() {
  this.onStageTransformEnd = this.onStageTransformEnd.bind(this);
  this.onStageTransform = this.onStageTransform.bind(this);
  this.addEdge = this.addEdge.bind(this);
  this.addCorner = this.addCorner.bind(this);
  this.addTile = this.addTile.bind(this);
  this.redraw = this.redraw.bind(this);

  Board.apply(this, arguments);
  emitter(this);

  this.bgGroup = new Konva.Group();
  this.fgGroup = new Konva.Group();
  this.layer = new Konva.Layer({
    rotation: 0,
    draggable: true
  });

  this.layer.add(this.bgGroup);
  this.layer.add(this.fgGroup);
}

core.util.inherits(UiBoard, Board);

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

},{"colonizers-core":46,"component-emitter":undefined,"konva":undefined}],18:[function(require,module,exports){
  'use strict';

var Game = require('./game'),
    Board = require('./board'),
    HexTile = require('./hex-tile'),
    HexCorner = require('./hex-corner'),
    HexEdge = require('./hex-edge'),
    Player = require('./player'),
    observableProps = require('./observable-properties');

function Factory(tileset) {
  this.tileset = tileset;

  // Process tileset, converting image data uris to image elements
  Object.keys(this.tileset.tiles).forEach(function(key) {
    if (this.tileset.tiles[key].bgimage) {
      var img = new Image();
      img.src = this.tileset.tiles[key].bgimage;
      this.tileset.tiles[key].bgimage = img;
    }
  }, this);
}

Factory.prototype.createGame = function(options) {
  return new Game(this, options);
};

Factory.prototype.createBoard = function(options) {
  return new Board(this, options);
};

Factory.prototype.createHexTile = function(options) {
  return new HexTile(this, options, this.tileset);
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
    core = require('colonizers-core'),
    Game = core.Game;

function UiGame() {
  Game.apply(this, arguments);
  emitter(this);
}

core.util.inherits(UiGame, Game);

UiGame.prototype.offerTrade = function(options) {
  Game.prototype.offerTrade.call(this, options);
  this.emit('TradeOffered');
};

UiGame.prototype.draw = function() {
  this.emit('draw');
};

UiGame.prototype.getPlayerColors = function() {
  if (!this._playerColors) {

    var colors = ['#d9534f', '#5cb85c', '#428bca', '#d9534f'],
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

UiGame.prototype.showBuildableCities = function() {
  var currentPlayer = this.currentPlayer,
      settlements = this.getSettlementsForPlayer(currentPlayer);

  settlements.forEach(function(settlement) {
    settlement.show(currentPlayer);
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

},{"colonizers-core":46,"component-emitter":undefined}],20:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Konva = require('konva'),
    core = require('colonizers-core'),
    HexCorner = core.HexCorner;

function UiHexCorner(factory, options) {
  HexCorner.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

core.util.inherits(UiHexCorner, HexCorner);

UiHexCorner.prototype.render = function(options) {
  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y,
    visible: false
  });

  this.drawing = new Konva.Circle({
    x: 0,
    y: 0,
    radius: 8
  });

  this.group.add(this.drawing);
};

UiHexCorner.prototype.hookupEvents = function() {
  this.drawing.on('mouseover', function() {
    $(this.drawing.getStage().container()).addClass('clickable');
  }.bind(this));

  this.drawing.on('mouseout', function() {
    $(this.drawing.getStage().container()).removeClass('clickable');
  }.bind(this));

  this.drawing.on('click', function() {
    if (!this.isSettlement)
    {
      this.emit('click', { type: 'settlement', id: this.id});
    }
    else
    {
      this.emit('click', { type: 'city', id: this.id});
    }
  }.bind(this));

  this.drawing.on('tap', function() {
    if (!this.isSettlement)
    {
      this.emit('click', { type: 'settlement', id: this.id});
    }
    else
    {
      this.emit('click', { type: 'city', id: this.id});
    }
  }.bind(this));
};

UiHexCorner.prototype.buildSettlement = function(player) {
  HexCorner.prototype.buildSettlement.call(this, player);

  var colors = this.board.game.getPlayerColors();

  this.drawing = new Konva.Shape({
    stroke: 'white',
    strokeWidth: 1,
    fill: colors[player.id],
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-10, -5);
      context.beginPath();
      context.lineTo(-10, 11);
      context.lineTo(10, 11);
      context.lineTo(10, -5);
      context.lineTo(0, -15);
      context.lineTo(-10, -5);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  this.group.show();
  this.group.draw();

  this.hookupEvents();
};

UiHexCorner.prototype.buildCity = function(player) {
  HexCorner.prototype.buildCity.call(this, player);

  var colors = this.board.game.getPlayerColors();

  this.drawing = new Konva.Shape({
    stroke: 'white',
    strokeWidth: 1,
    fill: colors[player.id],
    opacity: 1,
    x: 0,
    y: 0,
    drawFunc: function(context) {
      context.moveTo(-19, -9);
      context.beginPath();
      context.lineTo(-19, 17);
      context.lineTo(19, 17);
      context.lineTo(19, -1);
      context.lineTo(1, -1);
      context.lineTo(1, -9);
      context.lineTo(-9, -19);
      context.lineTo(-19, -9);
      context.closePath();
      context.fillStrokeShape(this);
    }
  });

  this.group.add(this.drawing);

  this.group.show();
  this.group.draw();
};

UiHexCorner.prototype.show = function(player) {
  var colors;
  if (this.isBuildable) {
    colors = this.board.game.getPlayerColors();
    this.drawing.fill(colors[player.id]);
    this.drawing.opacity(0.4);
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

UiHexCorner.prototype.addToBoard = function(board) {
  HexCorner.prototype.addToBoard.call(this, board);

  board.on('board:rotate', function(rotation) {
    this.group.rotation(-rotation);
  }.bind(this));
};

module.exports = UiHexCorner;

},{"colonizers-core":46,"component-emitter":undefined,"jquery":undefined,"konva":undefined}],21:[function(require,module,exports){
'use strict';

var $ = require('jquery'),
    emitter = require('component-emitter'),
    Konva = require('konva'),
    core = require('colonizers-core'),
    HexEdge = core.HexEdge,
    MathHelper = core.MathHelper;

function UiHexEdge(factory, options) {
  HexEdge.apply(this, arguments);
  emitter(this);
  this.render(options);
  this.hookupEvents();
}

core.util.inherits(UiHexEdge, HexEdge);

UiHexEdge.prototype.render = function(options) {
  var rotation = MathHelper.getAngle(options.ends[0], options.ends[1]),
      height = 10,
      width = options.hexInfo.circumradius - 36;

  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y,
    rotation: rotation
  });

  this.rect = new Konva.Rect({
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
      type: 'road',
      id: this.id
    });
  }.bind(this));

  this.rect.on('tap', function() {
    this.emit('click', {
      type: 'road',
      id: this.id
    });
  }.bind(this));
};

UiHexEdge.prototype.build = function(player) {
  var colors = this.board.game.getPlayerColors();

  HexEdge.prototype.build.call(this, player);

  this.rect.fill(colors[player.id]);
  this.rect.height(6);
  this.rect.y(-6 / 2);
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

},{"colonizers-core":46,"component-emitter":undefined,"jquery":undefined,"konva":undefined}],22:[function(require,module,exports){
'use strict';

var _ = require('underscore'),
    Konva = require('konva'),
    core = require('colonizers-core'),
    HexTile = core.HexTile,
    NumberToken = require('./number-token');

function UiHexTile(factory, options, tileset) {
  HexTile.apply(this, arguments);
  this.addToBoard = this.addToBoard.bind(this);
  this.render(options, tileset);
}

core.util.inherits(UiHexTile, HexTile);

UiHexTile.prototype.render = function(options, tileset) {
  var tileStyle = tileset.tiles[options.type],
      tileSpacing = tileset.board.tilespacing || 8,
      hexagonOpts = this.getHexOptions(tileStyle, tileSpacing, options.hexInfo);

  this.numberToken = null;

  this.hexagon = new Konva.RegularPolygon(hexagonOpts);
  this.group = new Konva.Group({
    x: options.center.x,
    y: options.center.y
  });

  this.group.add(this.hexagon);

  if (tileStyle.stroke) {
    this.hexagon2 = new Konva.RegularPolygon({
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

  if (tileset.board && tileset.board.bgcolor) {
    this.bgHexagon = new Konva.RegularPolygon({
      x: options.center.x,
      y: options.center.y,
      sides: 6,
      radius: options.hexInfo.circumradius + tileSpacing,
      rotation: 270,
      fill: tileset.board.bgcolor
    });
  }
  this.group.add(this.hexagon2);

  if (options.value > 0) {
    this.addNumberToken(options.value);
  }
};

UiHexTile.prototype.getHexOptions = function(tileStyle, tileSpacing, hexInfo) {
  var options = {
        x: 0,
        y: 0,
        sides: 6,
        radius: hexInfo.circumradius - tileSpacing,
        rotation: 270,
        fill: tileStyle.bgcolor,
        opacity: tileStyle.opacity || 1
      },
      patternScale;

  if (tileStyle.bgimage) {
    patternScale = hexInfo.circumradius * 2 / tileStyle.bgimage.width;
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
  this.group.add(this.numberToken.group);
};

UiHexTile.prototype.addToBoard = function(board) {
  HexTile.prototype.addToBoard.call(this, board);
  if (this.numberToken) {
    board.on('board:rotate', this.numberToken.onBoardRotate);
  }
};

module.exports = UiHexTile;

},{"./number-token":23,"colonizers-core":46,"konva":undefined,"underscore":undefined}],23:[function(require,module,exports){
'use strict';

var Konva = require('konva');

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

  this.group = new Konva.Group({
    x: 0,
    y: 0,
    rotation: 0
  });

  this.renderCircle();
  this.renderText(dotInfo, value);
  this.renderDots(dotInfo);
};

NumberToken.prototype.renderCircle = function() {
  var circle = new Konva.Circle({
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
  var text = new Konva.Text({
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
    this.group.add(new Konva.Circle({
      x: (4 * i) + dotInfo.offset,
      y: 12,
      radius: 1,
      fill: dotInfo.color
    }));
  }
};

NumberToken.prototype.onBoardRotate = function(rotation) {
  this.group.rotation(-rotation);
};

module.exports = NumberToken;

},{"konva":undefined}],24:[function(require,module,exports){
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
    core = require('colonizers-core'),
    Player = core.Player;

function UiPlayer() {
  Player.apply(this, arguments);
  emitter(this);
}

core.util.inherits(UiPlayer, Player);

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

},{"colonizers-core":46,"component-emitter":undefined}],27:[function(require,module,exports){
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
    Konva = require('konva');

function Stage(container) {
  this.onResize = this.onResize.bind(this);
  this.draw = this.draw.bind(this);

  this.container = container;
  this.game = null;
  this.board = null;
  this.minScale = 1;
  this.height = $(this.container).height();
  this.width = $(this.container).width();
  this.stage = new Konva.Stage({
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
  var layer = new Konva.Layer({
        x: this.width / 2,
        y: this.height / 2
      }),
      text = new Konva.Text({
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

},{"./stage-navigator":30,"jquery":undefined,"konva":undefined}],32:[function(require,module,exports){
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

function UserInterface(options) {
  this.onBoardClick = this.onBoardClick.bind(this);
  this.onBuildSettlement = this.onBuildSettlement.bind(this);
  this.onBuildCity = this.onBuildCity.bind(this);
  this.onBuildRoad = this.onBuildRoad.bind(this);
  this.onTurnEnd = this.onTurnEnd.bind(this);
  this.onTurnStart = this.onTurnStart.bind(this);

  this.game = null;
  this.socket = options.socket;
  this.emitterQueue = options.emitterQueue;

  this.viewModel = new RootViewModel({
    actions: new ViewActions(options.socket),
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

  if (!this.viewModel.myTurn) {
    return;
  }

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

UserInterface.prototype.onBuildCity = function() {
  this.game.showBuildableCities();
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
    if (data.type === 'settlement') {
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

},{"./components/alert":3,"./components/build-modal":5,"./components/menu":9,"./components/player":11,"./components/players":13,"./components/stage":14,"./components/trade-modal":16,"./model/index":27,"./view-actions":33,"knockout":undefined}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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
  corner.addToBoard(this);
};

Board.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  edge.addToBoard(this);
};

module.exports = Board;

},{"./collections/hex-collections":36}],36:[function(require,module,exports){
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

},{"./../util":49,"./query-clauses":37,"./queryable-collection":38}],37:[function(require,module,exports){
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

},{"./../math-helper":47}],38:[function(require,module,exports){
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

},{"underscore":undefined}],39:[function(require,module,exports){
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

},{"async":undefined}],40:[function(require,module,exports){
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

  if (data.buildType === 'settlement') {
    corner = this.game.board.corners.getById(data.buildId);
    corner.buildSettlement(player);
    player.addVictoryPoint();
    if (this.game.phase !== 'setup') {
      player.spend({
        lumber: 1,
        brick: 1,
        wool: 1,
        grain: 1
      });
    }
  } else if (data.buildType === 'city') {
    corner = this.game.board.corners.getById(data.buildId);
    corner.buildCity(player);
    player.addVictoryPoint();

    player.spend({
      ore: 3,
      grain: 2
    });
  } else if (data.buildType === 'road') {
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

},{}],41:[function(require,module,exports){
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
      center: corner.center,
      isSettlement: corner.isSettlement,
      isCity: corner.isCity
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
  board.addEdges(edges);
  board.addCorners(corners);

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

      if (corner.isSettlement)
        hexCorner.buildSettlement(player);
      else if (corner.isCity)
        hexCorner.buildCity(player);
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

},{"underscore":undefined}],42:[function(require,module,exports){
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

Game.prototype.getSettlementsForPlayer = function(player) {
  return this.board.corners.query({
    isSettlement: true,
    owner: player
  });
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

},{"underscore":undefined}],43:[function(require,module,exports){
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

HexCorner.prototype.addToBoard = function(board) {
  this.board = board;
};

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

HexCorner.prototype.buildSettlement = function(player) {
  var corners = this.getAdjacentCorners();

  this.owner = player.id;
  this.isBuildable = false;
  this.buildType = 'settlement';

  corners.forEach(function(corner) {
    corner.isBuildable = false;
  });
};

HexCorner.prototype.buildCity = function(player) {
  var corners = this.getAdjacentCorners();

  this.owner = player.id;
  this.isBuildable = false;
  this.buildType = 'city';

  corners.forEach(function(corner) {
    corner.isBuildable = false;
  });
};

module.exports = HexCorner;

},{"./board-entity":34,"./util":49}],44:[function(require,module,exports){
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

HexEdge.prototype.addToBoard = function(board) {
  this.board = board;
};

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

},{"./board-entity":34,"./util":49}],45:[function(require,module,exports){
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

HexTile.prototype.addToBoard = function(board) {
  this.board = board;
};

HexTile.prototype.isResource = function() {
  return this.type !== 'sea' && this.type !== 'desert';
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

},{"./board-entity":34,"./util":49}],46:[function(require,module,exports){
'use strict';

module.exports = {
  EmitterQueue: require('./emitter-queue'),
  GameCoordinator: require('./game-coordinator'),
  GameSerializer: require('./game-serializer'),
  MathHelper: require('./math-helper'),
  Board: require('./board'),
  Game: require('./game'),
  HexCorner: require('./hex-corner'),
  HexEdge: require('./hex-edge'),
  HexTile: require('./hex-tile'),
  Player: require('./player'),
  util: require('./util')
};

},{"./board":35,"./emitter-queue":39,"./game":42,"./game-coordinator":40,"./game-serializer":41,"./hex-corner":43,"./hex-edge":44,"./hex-tile":45,"./math-helper":47,"./player":48,"./util":49}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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
