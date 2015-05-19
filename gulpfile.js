'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var replace = require('gulp-replace');
var less = require('gulp-less');

// Site

gulp.task('styles', function() {
  return gulp.src(['./server/assets/less/site.less'])
    .pipe(less())
    .pipe(gulp.dest('./server/assets/css'));
});

gulp.task('jquery-plugins', function() {
  var paths = [
    'node_modules/bootstrap/js/tab.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ];

  var head = 'var jQuery = require(\'jquery\'),\n    $ = jQuery;\n\n';
  var foot = '\n\nmodule.exports = jQuery;\n';

  paths = paths.map(function(p) { return path.join(__dirname, p); });

  return gulp.src(paths)
    .pipe(replace('window.jQuery', 'jQuery'))
    .pipe(replace('window.$', '$'))
    .pipe(concat('jquery-plugins.js'))
    .pipe(insert.wrap(head, foot))
    .pipe(gulp.dest('server/assets/js'));
});

gulp.task('default', ['jquery-plugins', 'styles']);
