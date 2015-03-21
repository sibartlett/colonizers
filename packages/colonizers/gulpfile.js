'use strict';

var gulp = require('gulp'),
    dev = require('colonizers-dev'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    less = require('gulp-less');

// Site

gulp.task('styles', function() {
  return gulp.src(['./app/less/site.less'])
    .pipe(less())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('jquery-plugins', function() {
  return dev.gulp.bundleJqueryPlugins(__dirname, [
    'node_modules/bootstrap/js/tab.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ])
  .pipe(gulp.dest('vendor'));
});

// Code quality

gulp.task('hint', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!public/**.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!public/**.js'
  ])
  .pipe(jscs());
});

gulp.task('default', ['jquery-plugins', 'styles']);
