'use strict';

var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    insert = require('gulp-insert'),
    replace = require('gulp-replace'),
    File = require('gulp-util').File,
    through = require('through'),
    dataurl = require('dataurl'),
    imagemin = require('gulp-imagemin'),
    group = require('gulp-group-files'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    less = require('gulp-less'),
    tilesets = {
      modern: [],
      watercolor: []
    };

function combineFiles(tileset) {
  var cwd = __dirname,
      base = path.join(cwd, 'tilesets', tileset),
      dest = path.join(base, tileset + '.json'),
      data = require(path.join(base, '_.js'));

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
  return gulp.src(['./app/less/game.less'])
    .pipe(less())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('jquery-plugins', function() {
  var paths, head, foot;

  paths = [
    'node_modules/bootstrap/js/modal.js',
    'node_modules/bootstrap/js/tab.js',
    'node_modules/bootstrap/js/transition.js',
    'node_modules/jasny-bootstrap/js/offcanvas.js',
    'node_modules/jasny-bootstrap/js/transition.js'
  ];

  head = 'var jQuery = require(\'jquery\'),\n    $ = jQuery;\n\n';
  foot = '\n\nmodule.exports = jQuery;\n';

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

gulp.task('default', ['jquery-plugins', 'styles', 'tilesets']);
