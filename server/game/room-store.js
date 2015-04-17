'use strict';

var mongoose = require('mongoose');

function RoomStore(io) {
  this.io = io;
  this.rooms = {};
  this.promises = {};
  this.get = this.get.bind(this);
}

RoomStore.prototype.get = function(id, cb) {
  var Room = mongoose.model('Room');

  if (!this.rooms[id]) {
    this.promises[id] = new Promise(function(resolve, reject) {
      Room.findById(id)
        .populate('users')
        .exec(function(err, doc) {
          if (err) {
            delete this.promises[id];
            return reject(err);
          }

          if (!doc) {
            delete this.promises[id];
            return resolve();
          }

          var room = {
            doc: doc
          };

          doc.io = this.io;
          doc.postLoad();

          this.rooms[id] = room;
          resolve(room);
        }.bind(this));
    }.bind(this));
  }

  if (this.rooms[id]) {
    return cb(this.rooms[id]);
  } else if (this.promises[id]) {
    return this.promises[id].then(cb);
  } else {
    cb();
  }
};

exports.register = function(server, options, next) {
  var io = server.plugins['hapi-io'].io;
  server.expose('store', new RoomStore(io));
  next();
};

exports.register.attributes = {
  name: 'room-store'
};
