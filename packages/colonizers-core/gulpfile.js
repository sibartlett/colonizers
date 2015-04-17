'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

gulp.task('hint', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!dist/**/*.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', function() {
  return gulp.src([
    '**/*.js',
    '!node_modules/**/*.js',
    '!dist/**/*.js'
  ])
  .pipe(jscs());
});

gulp.task('default', ['hint']);
