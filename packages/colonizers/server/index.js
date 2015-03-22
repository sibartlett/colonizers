'use strict';

var hogan = require('hogan-express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    browserify = require('browserify-middleware'),
    session = require('express-session'),
    express = require('express'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    RoomSchema = require('./schema/room'),
    UserSchema = require('./schema/user'),
    RoomManager = require('./room-manager'),
    passportSocketIo = require('passport.socketio'),
    bunyan = require('bunyan'),
    uuid = require('node-uuid');

function App(options) {
  this.options = options;
}

App.prototype.start = function() {
  var createSessionStore,
      sessionStore,
      port;

  this.config = this.options.config;
  this.logger = this.getBunyanLogger();
  this.app = express();
  this.http = require('http').Server(this.app);
  this.io = require('socket.io')(this.http);

  this.createDbConnection(function() {

    this.roomManager = new RoomManager({
      db: this.db,
      io: this.io,
      logger: this.logger,
      urlFactory: this.getClientUrl
    });

    createSessionStore = this.createSessionStore.bind(this);
    sessionStore = createSessionStore(session);

    this.configureExpress(sessionStore);
    this.configurePassport(sessionStore);
    this.configureRoutes();
    this.configureIo();

    port = this.config.get('PORT');
    this.http.listen(port, function() {
      console.log('listening on *:' + port);
    });
  });
};

App.prototype.createDbConnection = function(cb) {
  // Try looking for Heroku database connection first
  var dbUrl = this.config.get('MONGOHQ_URL') ||
              this.config.get('MONGOLAB_URI') ||
              this.config.get('database:mongo');

  this.db = mongoose.createConnection(dbUrl, function(err) {
    this.db.model('Room', RoomSchema);
    this.db.model('User', UserSchema);
    cb.bind(this)(err);
  }.bind(this));
};

App.prototype.createSessionStore = function(session) {
  var MongoStore = require('connect-mongo')(session);
  return new MongoStore({ mongooseConnection: this.db });
};

App.prototype.getBunyanLogger = function() {
  return bunyan.createLogger({ name: 'colonizers' });
};

App.prototype.configureExpress = function(sessionStore) {
  var sessionKey = this.config.get('session:key'),
      sessionSecret = this.config.get('session:secret');

  this.app.set('views', __dirname + '/../views');
  this.app.set('view engine', 'html');
  this.app.set('layout', 'layout');
  this.app.engine('html', hogan);

  this.app.use(cookieParser());
  this.app.use(bodyParser.urlencoded({
    extended: true
  }));
  this.app.use(bodyParser.json());

  this.app.use(session({
    key: sessionKey,
    secret: sessionSecret,
    store: sessionStore,
    resave: true,
    saveUninitialized: true
  }));
};

App.prototype.configurePassport = function(sessionStore) {
  var sessionKey = this.config.get('session:key'),
      sessionSecret = this.config.get('session:secret'),
      User = this.db.model('User');

  this.app.use(passport.initialize());
  this.app.use(passport.session());

  passport.use(User.createStrategy());
  passport.serializeUser(User.passportSerialize());
  passport.deserializeUser(User.passportDeserialize());

  this.io.use(passportSocketIo.authorize({
    passport: passport,
    cookieParser: cookieParser,
    key: sessionKey,
    secret: sessionSecret,
    store: sessionStore
  }));
};

App.prototype.clientUrl = '/room/:id';

App.prototype.getClientUrl = function(roomId) {
  return '/room/' + roomId;
};

App.prototype.configureRoutes = function() {
  var User = this.db.model('User'),
      logger = this.logger,
      roomManager = this.roomManager,
      clientUrl = this.getClientUrl,
      authenticate = function(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        } else {
          return res.redirect('/login');
        }
      },
      shared = [
        'jquery', 'component-emitter'
        // 'socket.io-client' - causes a stack overflow on the client
        ];

  this.app.get('/common.js', browserify(shared));
  this.app.get('/room.js', browserify('./app/js/room.js', {external: shared}));
  this.app.get('/site.js', browserify('./app/js/site.js', {external: shared}));

  this.app.use(express['static'](__dirname + '/../public/'));

  this.app.use(function(req, res, next) {
    var logOpt = {
      reqId: uuid()
    };
    if (req.user) {
      logOpt.userId = req.user._id.toString();
      logOpt.userName = req.user.name.toString();
    }
    req.logger = logger.child(logOpt);
    req.logger.info(req.method + ' ' + req.url);
    next();
  });

  this.app.use(function(req, res, next) {
    res.locals.user = req.user ? req.user.toSafeObject() : null;
    res.locals.authenticated = req.user && !req.user.anonymous;
    next();
  });

  this.app.use(function(err, req, res, next) {
    var log = req.logger || logger;
    log.error(err);
    next();
  });

  this.app.get('/', authenticate, function(req, res) {
    res.redirect('/lobby');
  });

  this.app.get('/lobby', authenticate, function(req, res) {
    roomManager.getRooms(function(err, rooms) {
      res.render('lobby', {
        rooms: rooms
      });
    });
  });

  this.app.get('/login', function(req, res) {
    res.render('login');
  });

  this.app.post('/new', authenticate, function(req, res) {
    var gameOptions = {
      scenario: req.param('scenario'),
      numPlayers: parseInt(req.param('numPlayers'), 10)
    };

    roomManager.create({
      user: req.user,
      numPlayers: gameOptions.numPlayers,
      gameOptions: gameOptions
    }, function(err, room) {
      res.redirect(clientUrl(room.id));
    });
  });

  this.app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

  this.app.post('/register', function(req, res) {
    var password = req.param('password'),
        user = new User({
          username: req.param('username'),
          name: req.param('name'),
          email: req.param('email')
        });

    User.register(user, password, function() {
      req.login(user, function() {
        res.redirect('/');
      });
    });
  });

  this.app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  this.app.get('/account', authenticate, function(req, res) {
    res.render('account');
  });

  this.app.post('/account', authenticate, function(req, res) {
    var user = req.user,
        password = req.param('password'),
        password2 = req.param('password2'),
        cb;

    user.set('username', req.param('username'));
    user.set('name', req.param('name'));
    user.set('email', req.param('email'));

    cb = function() {
      user.save(function() {
        req.login(user, function() {
          res.redirect('/account');
        });
      });
    };

    if (password && password.length && password === password2) {
      user.setPassword(req.param('password'), cb);
    } else {
      cb();
    }

  });

  // Game routes
  this.app.get('/room/:id', authenticate, function(req, res) {
    res.render('game', {
      layout: null,
      roomId: req.param('id'),
      userId: req.user._id
    });
  });

  this.app.use(express.static(
    __dirname + '/../node_modules/colonizers-client/public'
  ));
};

App.prototype.configureIo = function() {
  var roomManager = this.roomManager;

  this.io.on('connection', function(socket) {
    socket.on('room', function(roomId) {
      roomManager.joinRoom(roomId, socket);
    });
  });
};

module.exports = App;
