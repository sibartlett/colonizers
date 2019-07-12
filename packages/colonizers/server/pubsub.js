'use strict';

var url = require('url');
var util = require('util');
var Hoek = require('hoek');
var Rabbit = require('wascally');
var Rabbus = require('rabbus');

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults({
    connection: {
      'server': 'localhost'
    },
    exchange: 'socket-io.exchange',
    queue: 'socket-io.queue',
    routingKey: 'socket-io.key',
    messageType: 'socket-io.messageType'
  }, options);

  options.queue = {
    name: options.queue,
    autoDelete: true
  };

  var connection = options.connection;

  if (connection.url) {
    var uri = url.parse(connection.url);

    connection.protocol = uri.protocol + '//';
    connection.server = uri.hostname;
    connection.vhost = uri.path.substr(1);

    if (uri.port) {
      connection.port = parseInt(uri.port, 10);
    }

    if (uri.auth) {
      var authParts = uri.auth.split(':');
      connection.user = authParts[0];
      connection.pass = authParts[1];
    }

    delete connection.url;
  }

  Rabbit.configure({
    connection: connection
  }).then(function() {

    function Publisher(rabbus) {
      Rabbus.Publisher.call(this, rabbus, {
        exchange: options.exchange,
        routingKey: options.routingKey,
        messageType: options.messageType
      });
    }

    util.inherits(Publisher, Rabbus.Publisher);

    var publisher = new Publisher(Rabbit);

    function Subscriber(rabbus) {
      Rabbus.Subscriber.call(this, rabbus, {
        exchange: options.exchange,
        queue: options.queue,
        routingKey: options.routingKey,
        messageType: options.messageType
      });
    }

    util.inherits(Subscriber, Rabbus.Subscriber);

    var subscriber = new Subscriber(Rabbit);
    var io = server.plugins['hapi-io'].io;

    subscriber.subscribe(function(message) {
      var emitter = message.room ? io.to(message.room) : io;
      emitter.emit(message.event, message.data);
    });

    server.expose('publisher', publisher);
    server.expose('subscriber', subscriber);
    server.expose('publish', function(message) {
      publisher.publish(message);
    });

    next();

  });
};

exports.register.attributes = {
  name: 'pubsub',
  dependencies: ['hapi-io']
};
