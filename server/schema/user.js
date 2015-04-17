'use strict';

var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var url = require('url');
var md5 = function(word) {
  return crypto.createHash('md5').update(word).digest('hex');
};

var UserSchema = new Schema({
  username: String,
  name: String,
  email: String,
  password: String
});

UserSchema.virtual('id').get(function() {
  return this._id.toString();
});

UserSchema.virtual('avatarUrl').get(function() {
  return url.format({
    protocol: 'https',
    host: 'secure.gravatar.com',
    pathname: '/avatar/' + md5(this.email),
    query: {
      s: 100
    }
  });
});

UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  bcrypt.hash(this.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }

    this.password = hash;
    next();
  }.bind(this));
});

UserSchema.methods.toJSON = function() {
  return {
    id: this.id,
    username: this.username,
    name: this.name,
    avatarUrl: this.avatarUrl
  };
};

UserSchema.methods.authenticate = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, res) {
    // res == true
    if (res) {
      return cb(null, this);
    } else {
      return cb(null, null, { message: 'Invalid login' });
    }
  }.bind(this));
};

UserSchema.statics.authenticate = function(username, password, cb) {
  // Users should be able to login using username or email
  var conditions = [
    { username: username },
    { email: username }
  ];

  this.findOne().or(conditions).exec(function(err, user) {
    if (err) {
      return cb(err);
    }

    if (user) {
      return user.authenticate(password, cb);
    } else {
      return cb();
    }
  });
};

module.exports = UserSchema;
