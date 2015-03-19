'use strict';

var gulp = require('gulp'),
    dev = require('colonizers-dev'),
    // jshint = require('gulp-jshint'),
    // jscs = require('gulp-jscs'),
    less = require('gulp-less'),
    clientDependencies;

// Client

clientDependencies = [
  'async',
  'component-emitter',
  'hammerjs',
  'jquery',
  'jquery-mousewheel',
  'knockout',
  'konva',
  'screenfull',
  'socket.io-client',
  'underscore'
];

gulp.task('demo-fonts', function() {
  return gulp.src('./node_modules/colonizers-client/public/fonts/*')
             .pipe(gulp.dest('./fonts/'))
});

gulp.task('demo-images', function() {
  return gulp.src('./node_modules/colonizers-client/public/img/*')
             .pipe(gulp.dest('./img/'))
});

gulp.task('demo-styles', function() {
  return gulp.src(['./node_modules/colonizers-client/app/less/game.less'])
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('jquery-plugins', function() {
  return dev.gulp.bundleJqueryPlugins(__dirname, [
    './node_modules/colonizers-client/node_modules/bootstrap/js/modal.js',
    './node_modules/colonizers-client/node_modules/bootstrap/js/tab.js',
    './node_modules/colonizers-client/node_modules/bootstrap/js/transition.js',
    './node_modules/colonizers-client/node_modules/jasny-bootstrap/js/offcanvas.js',
    './node_modules/colonizers-client/node_modules/jasny-bootstrap/js/transition.js'
  ])
  .pipe(gulp.dest('temp'));
});

gulp.task('demo-lib', ['jquery-plugins'], function() {
  return dev.gulp.bundle({
    dest: './js/lib.js',
    require: clientDependencies,
    jquery: './temp/jquery-plugins.js',
    options: {
      debug: false
    }
  });
});

function buildClient(watch) {
  return dev.gulp.bundle({
    baseDir: __dirname,
    file: './demo.js',
    dest: './js/demo.js',
    exclude: clientDependencies.concat(['jquery-plugins']),
    watch: watch,
    options: {
      debug: false
    }
  });
}

gulp.task('demo-script', function() {
  return buildClient();
});

gulp.task('demo', ['demo-script', 'demo-lib', 'demo-styles', 'demo-fonts', 'demo-images']);

gulp.task('default', ['demo']);
