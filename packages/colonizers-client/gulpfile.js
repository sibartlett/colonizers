'use strict';

var gulp = require('gulp'),
    dev = require('colonizers-dev'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    less = require('gulp-less'),
    clientDependencies;

// Client

clientDependencies = [
  'async',
  'component-emitter',
  'hammerjs',
  'jquery',
  'jquery-mousewheel',
  'konva',
  'knockout',
  'screenfull',
  'socket.io-client',
  'underscore'
];

gulp.task('styles', function() {
  return gulp.src(['./app/less/game.less'])
    .pipe(less())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('jquery-plugins', function() {
  return dev.gulp.bundleJqueryPlugins(__dirname, [
    'node_modules/bootstrap/js/modal.js',
    'node_modules/bootstrap/js/tab.js',
    'node_modules/bootstrap/js/transition.js',
    'node_modules/jasny-bootstrap/js/offcanvas.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ])
  .pipe(gulp.dest('temp'));
});

gulp.task('lib', ['jquery-plugins'], function() {
  return dev.gulp.bundle({
    dest: './public/lib.js',
    require: clientDependencies,
    jquery: './temp/jquery-plugins.js',
    options: {
      debug: true
    }
  });
});

function buildClient(watch) {
  return dev.gulp.bundle({
    baseDir: __dirname,
    file: './app/js/index.js',
    dest: './public/room.js',
    exclude: clientDependencies.concat(['jquery-plugins']),
    watch: watch,
    options: {
      debug: true
    }
  });
}

gulp.task('script', function() {
  return buildClient();
});

gulp.task('client', ['script', 'lib', 'styles']);

// Code quality

gulp.task('hint', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!public/**/*.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!public/**/*.js'
  ])
  .pipe(jscs());
});

gulp.task('watch', ['lib'], function() {
  buildClient(true);
  return gulp.watch(['*.less'], ['styles']);
});

gulp.task('default', ['script', 'lib', 'styles']);
