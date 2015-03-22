'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto'),
    localAuth = require('./../auth/local'),
    uuid = require('node-uuid'),
    url = require('url'),
    md5 = function(word) {
      return crypto.createHash('md5').update(word).digest('hex');
    },
    UserSchema;

UserSchema = new Schema({
  username: String,
  name: String,
  email: String,

  // authToken provides a means to invalidate existing session tokens
  // If a user changes their password, all other sessions are revoked
  authToken: String,

  auths: []
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

UserSchema.plugin(localAuth);

UserSchema.methods.toJSON = function() {
  return {
    id: this.id,
    username: this.username,
    name: this.name,
    avatarUrl: this.avatarUrl
  };
};

UserSchema.methods.generateAuthToken = function() {
  this.authToken = uuid();
};

UserSchema.methods.getAuth = function(key) {
  var auths = this.auths.filter(function(auth) {
    return auth.key === key;
  });

  return auths.length ? auths[0] : null;
};

UserSchema.methods.setAuth = function(key, auth, resetAuthToken) {
  var auths = this.auths.filter(function(auth) {
    return auth.key !== key;
  });

  auth.key = key;
  auths.push(auth);

  this.set('auths', auths);

  if (resetAuthToken) {
    this.generateAuthToken();
  }
};

UserSchema.statics.passportSerialize = function() {
  return function(user, cb) {
    cb(null, user._id.toString() + '|' + user.authToken);
  };
};

UserSchema.statics.passportDeserialize = function() {
  var _this = this;
  return function(cookie, cb) {
    var parts = cookie.split('|');

    _this.findOne({ _id: parts[0], authToken: parts[1] }, cb);
  };
};

module.exports = UserSchema;
