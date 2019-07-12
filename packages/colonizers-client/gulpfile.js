'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var replace = require('gulp-replace');
var File = require('gulp-util').File;
var through = require('through');
var dataurl = require('dataurl');
var imagemin = require('gulp-imagemin');
var group = require('gulp-group-files');
var less = require('gulp-less');
var tilesets = {
  modern: [],
  watercolor: []
};

function combineFiles(tileset) {
  var cwd = __dirname;
  var base = path.join(cwd, 'tilesets', tileset);
  var dest = path.join(base, tileset + '.json');
  var data = require(path.join(base, '_.js'));

  function bufferContents(file) {
    var name = path.basename(file.path).split('.');

    data.tiles[name[0]].bgimage = dataurl.convert({
      data: file.contents,
      mimetype: 'image/' + name[1]
    });
  }

  function endStream() {
    var file = new File({
      cwd: cwd,
      base: base,
      path: dest,
      contents: new Buffer(JSON.stringify(data))
    });

    this.emit('data', file);
    this.emit('end');
  }

  return through(bufferContents, endStream);
}

gulp.task('styles', function() {
  return gulp.src(['./less/game.less'])
    .pipe(less())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('jquery-plugins', function() {
  var paths = [
    'node_modules/bootstrap/js/modal.js',
    'node_modules/bootstrap/js/tab.js',
    'node_modules/bootstrap/js/transition.js',
    'node_modules/jasny-bootstrap/js/offcanvas.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ];

  var head = 'var jQuery = require(\'jquery\'),\n    $ = jQuery;\n\n';
  var foot = '\n\nmodule.exports = jQuery;\n';

  paths = paths.map(function(p) { return path.join(__dirname, p); });

  return gulp.src(paths)
    .pipe(replace('window.jQuery', 'jQuery'))
    .pipe(replace('window.$', '$'))
    .pipe(concat('jquery-plugins.js'))
    .pipe(insert.wrap(head, foot));
});

gulp.task('tilesets', group(tilesets, function(tileset) {
  return gulp.src('./tilesets/' + tileset + '/*.@(gif|png)')
             .pipe(imagemin())
             .pipe(combineFiles(tileset))
             .pipe(gulp.dest('./public/tilesets'));
}));

gulp.task('default', ['jquery-plugins', 'styles', 'tilesets']);
