'use strict';

var Hapi = require('hapi');

var isProd = process.env.NODE_ENV === 'production';

var server = new Hapi.Server();

server.connection({
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 3000,
  routes: {
    validate: {
      options: {
        abortEarly: false
      }
    }
  }
});

var plugins = [
  {
    register: require('./schema')
  },
  {
    register: require('hapi-mongoose-db-connector'),
    options: {
      mongodbUrl: process.env.MONGOLAB_URI ||
                  process.env.MONGOHQ_URL ||
                  'mongodb://localhost/colonizers'
    }
  },
  {
    register: require('hapi-auth-basic')
  },
  {
    register: require('hapi-auth-cookie')
  },
  {
    register: require('./auth/basic')
  },
  {
    register: require('./auth/cookie'),
    options: {
      password: process.env.COOKIE_SECRET || 'our little secret'
    }
  },
  {
    register: require('./validations')
  },
  {
    register: require('hapi-io'),
    options: {
      auth: {
        strategies: ['cookie']
      },
      socketio: { serveClient: false }
    }
  },
  {
    register: require('hapi-browserify'),
    options: {
      cache: isProd,
      precompile: isProd
    }
  },
  {
    register: require('./game/room-store')
  },
  {
    register: require('./game/game')
  },
  {
    register: require('hapi-context-credentials')
  },
  {
    register: require('./api/account'),
    options: {
      basePath: '/api'
    }
  },
  {
    register: require('./api/sessions'),
    options: {
      basePath: '/api'
    }
  },
  {
    register: require('./api/rooms'),
    options: {
      basePath: '/api'
    }
  },
  {
    register: require('./api/games'),
    options: {
      basePath: '/api'
    }
  },
  {
    register: require('./web/index')
  },
  {
    register: require('./web/login')
  },
  {
    register: require('./web/account')
  },
  {
    register: require('./web/lobby')
  },
  {
    register: require('./web/room')
  },
  {
    register: require('./assets')
  },
  {
    register: require('lout'),
    options: {
      filterRoutes: function(route) {
        return route.path.indexOf('/api') === 0;
      }
    }
  }
];

server.register(plugins, function(err) {
  if (err) {
    console.error('Failed to load a plugin:', err);
  }
});

server.auth.default({
  strategies: ['basic', 'cookie']
});

server.views({
  relativeTo: __dirname,
  path:'./web',
  layout: true,
  layoutPath: './web',

  engines: {
    html:{
      module: require('hapi-hogan'),
      compileMode: 'sync',
      isCached: isProd
    }
  }
});

server.start(function() {
  console.log('Server running at:', server.info.uri);
});
