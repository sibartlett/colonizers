'use strict';

var gulp = require('gulp'),
    gulptools = require('./gulptools'),
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
  'kinetic',
  'knockout',
  'screenfull',
  'socket.io-client',
  'underscore'
];

gulp.task('client-styles', function() {
  return gulp.src(['./client/less/game.less'])
    .pipe(less())
    .pipe(gulp.dest('./client/dist/css'));
});

gulp.task('client-jquery-plugins', function() {
  return gulptools.bundleJqueryPlugins([
    'node_modules/bootstrap/js/modal.js',
    'node_modules/bootstrap/js/tab.js',
    'node_modules/bootstrap/js/transition.js',
    'node_modules/jasny-bootstrap/js/offcanvas.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ])
  .pipe(gulp.dest('temp'));
});

gulp.task('client-lib', ['client-jquery-plugins'], function() {
  return gulptools.bundle({
    dest: './client/dist/lib.js',
    require: clientDependencies,
    jquery: './temp/jquery-plugins.js',
    options: {
      debug: true
    }
  });
});

function buildClient(watch) {
  return gulptools.bundle({
    file: './client/lib/index.js',
    dest: './client/dist/room.js',
    exclude: clientDependencies.concat(['jquery-plugins']),
    watch: watch,
    options: {
      debug: true
    }
  });
}

gulp.task('client-script', function() {
  return buildClient();
});

gulp.task('client', ['client-script', 'client-lib', 'client-styles']);

// Site

gulp.task('site-styles', function() {
  return gulp.src(['./server/less/site.less'])
    .pipe(less())
    .pipe(gulp.dest('./server/public/css'));
});

gulp.task('site-jquery-plugins', function() {
  return gulptools.bundleJqueryPlugins([
    'node_modules/bootstrap/js/tab.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ])
  .pipe(gulp.dest('temp'));
});

gulp.task('site-script', ['site-jquery-plugins'], function() {
  return gulptools.bundle({
    file: './server/client/site.js',
    dest: './server/public/site.js',
    jquery: './temp/jquery-plugins.js'
  });
});

gulp.task('site', ['site-script', 'site-styles']);

// Code quality

gulp.task('hint', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!spec/**/*.js',
    '!client/dist/**/*.js',
    '!server/public/**.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!spec/**/*.js',
    '!client/dist/**/*.js',
    '!server/public/**.js'
  ])
  .pipe(jscs());
});

gulp.task('watch', ['client-lib'], function() {
  buildClient(true);
  return gulp.watch(['client/*.less'], ['client-styles']);
});

gulp.task('default', ['client']);
