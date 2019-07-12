'use strict';

require('babel/register')({
  ignore: [/node_modules(?!.*colonizers)/]
});

var Hapi = require('hapi');
var views = require('./views');

var isProd = process.env.NODE_ENV === 'production';

var server = new Hapi.Server();

server.connection({
  host: process.env.COLONIZERS_HOST || process.env.HOST || 'localhost',
  port: process.env.COLONIZERS_PORT || process.env.PORT || 3000,
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
    register: require('inert')
  },
  {
    register: require('vision')
  },
  {
    register: require('good'),
    options: {
      opsInterval: 1000,
      reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
      }]
    }
  },
  {
    register: require('./schema')
  },
  {
    register: require('./mongoose'),
    options: {
      mongodbUrl: process.env.COLONIZERS_MONGO_URL ||
                  process.env.MONGOLAB_URI ||
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
    register: require('./auth'),
    options: {
      cookieSecret: process.env.COOKIE_SECRET || 'our little secret'
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
    register: require('./pubsub'),
    options: {
      connection: {
        url: process.env.COLONIZERS_RABBITMQ_URL ||
             process.env.CLOUDAMQP_URL ||
             process.env.RABBITMQ_BIGWIG_URL
      },
      queue: process.env.COLONIZERS_RABBITMQ_QUEUE
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
    return console.error('Failed to load a plugin:', err);
  }

  views(server, isProd);

  server.start(function() {
    console.log('Server running at:', server.info.uri);
  });
});
