'use strict';

exports.register = function(server, options, next) {

  var shared = [
    'jquery',
    'component-emitter',
    'socket.io-client',
    'knockout',
    'sweetalert'
  ];

  server.route({
    method: 'GET',
    path: '/css/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: [
          './server/assets/css',
          './node_modules/colonizers-client/public/css'
        ]
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/fonts/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: [
          './server/assets/fonts',
          './node_modules/colonizers-client/public/fonts'
        ]
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/img/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: [
          './node_modules/colonizers-client/public/img'
        ]
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/tilesets/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: [
          './node_modules/colonizers-client/public/tilesets'
        ]
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/script/{param*}',
    config: {
      auth: false
    },
    handler: {
      browserify: {
        bundle: {
          basedir: './server/web/',
          external: shared
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/site.js',
    config: {
      auth: false
    },
    handler: {
      browserify: {
        path: './server/assets/js/site.js',
        bundle: {
          require: shared
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/room.js',
    config: {
      auth: false
    },
    handler: {
      browserify: {
        path: './server/web/room/game.js'
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'assets'
};
