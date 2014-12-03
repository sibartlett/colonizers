'use strict';

// Based on passport-local-mongoose

var crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    options = {};

options.saltlen = 32;
options.iterations = 25000;
options.keylen = 512;
options.encoding = 'hex';
options.hashField = 'hash';
options.saltField = 'salt';

function schemaPlugin(schema) {

  schema.methods.authenticate = function(password, cb) {
    var auth = this.getAuth('local'),
        iterations = options.iterations,
        keylen = options.keylen,
        salt;

    if (!auth) {
      return cb('Invalid login');
    }

    salt = auth.salt;

    crypto.pbkdf2(password, salt, iterations, keylen, function(err, hashRaw) {
      if (err) {
        return cb(err);
      }

      var hash = new Buffer(hashRaw, 'binary').toString(options.encoding);

      if (hash === auth.hash) {
        return cb(null, this);
      } else {
        return cb(null, false, { message: 'Invalid login' });
      }
    }.bind(this));
  };

  schema.methods.setPassword = function(password, cb) {
    if (!password) {
      return cb('Missing password');
    }

    crypto.randomBytes(options.saltlen, function(err, buf) {
      if (err) {
        return cb(err);
      }

      var salt = buf.toString(options.encoding),
          iterations = options.iterations,
          keylen = options.keylen;

      crypto.pbkdf2(password, salt, iterations, keylen, function(err, hashRaw) {
        if (err) {
          return cb(err);
        }

        var buffer = new Buffer(hashRaw, 'binary');

        this.setAuth('local', {
          hash: buffer.toString(options.encoding),
          salt: salt
        }, true);

        cb(null, this);
      }.bind(this));
    }.bind(this));
  };

  schema.statics.authenticate = function() {
    var _this = this;

    return function(username, password, cb) {

      // Users should be able to login using username or email
      var conditions = [
        { username: username },
        { email: username }
      ];

      _this.findOne().or(conditions).exec(function(err, user) {
        if (err) { return cb(err); }

        if (user) {
          return user.authenticate(password, cb);
        } else {
          return cb(null, false, { message: 'Invalid login' });
        }
      });
    };
  };

  schema.statics.register = function(user, password, cb) {
    // Create an instance of this in case user isn't already an instance
    if (!(user instanceof this)) {
      user = new this(user);
    }

    if (!user.username) {
      return cb('Username is missing');
    }

    if (!user.email) {
      return cb('Email is missing');
    }

    var _this = this,
        conditions = [
          { username: user.username },
          { email: user.email }
        ];

    _this.find().or(conditions).exec(function(err, existingUsers) {
      if (err) { return cb(err); }

      if (existingUsers && existingUsers.length) {
        var e = existingUsers[0];

        if (user.email === e.email) {
          return cb('Email address already used');
        }

        if (user.username === e.username) {
          return cb('Username already taken');
        }

      }

      user.setPassword(password, function(err, user) {
        if (err) {
          return cb(err);
        }

        user.save(function(err) {
          if (err) {
            return cb(err);
          }

          cb(null, user);
        });
      });
    });
  };

  schema.statics.createStrategy = function() {
    return new LocalStrategy(options, this.authenticate());
  };
}

module.exports = schemaPlugin;
