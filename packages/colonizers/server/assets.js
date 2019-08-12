'use strict';

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/bundles/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: ['./dist']
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/css/{param*}',
    config: {
      auth: false
    },
    handler: {
      directory: {
        path: ['./server/assets/css', '../colonizers-client/public/css']
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
        path: ['./server/assets/fonts', '../colonizers-client/public/fonts']
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
        path: ['../colonizers-client/public/img']
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
        path: ['../colonizers-client/public/tilesets']
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
      directory: {
        path: ['./server/web/']
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'assets'
};
