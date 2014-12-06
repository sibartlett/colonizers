'use strict';

var _ = require('underscore'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    stringify = require('stringify'),
    watchify = require('watchify'),
    fs = require('fs'),
    path = require('path'),
    concat = require('gulp-concat'),
    insert = require('gulp-insert'),
    replace = require('gulp-replace'),
    mold = require('mold-source-map');

function bundleJqueryPlugins(paths) {
  var head = 'var jQuery = require(\'jquery\'),\n    $ = jQuery;\n\n',
      foot = '\n\nmodule.exports = jQuery;\n';

  paths = paths.map(function(p) { return path.join(__dirname, p); });

  return gulp.src(paths)
    .pipe(replace('window.jQuery', 'jQuery'))
    .pipe(replace('window.$', '$'))
    .pipe(concat('jquery-plugins.js'))
    .pipe(insert.wrap(head, foot));
}

function bundle(opts) {
  var debug = opts.options && opts.options.debug,
      destIndex = opts.dest.lastIndexOf('/'),
      dir = opts.dest.substring(0, destIndex),
      file = opts.dest.substring(destIndex + 1),
      mapFilePath = opts.dest + '.map.json',
      bundler,
      options,
      mapFileUrlComment,
      bundleFunc;

  if (opts.watch) {
    options = _.extend(opts.options || {}, watchify.args);
    bundler = browserify(opts.file || opts.files, options);
    bundler = watchify(bundler);
  } else {
    bundler = browserify(opts.file || opts.files, opts.options);
  }

  mapFileUrlComment = function(sourcemap, cb) {
    sourcemap.sourceRoot('file://');
    sourcemap.mapSources(mold.mapPathRelativeTo(__dirname + '/'));

    // write map file and return a sourceMappingUrl that points to it
    fs.writeFile(mapFilePath, sourcemap.toJSON(2), 'utf-8', function(err) {
      if (err) return console.error(err);
      cb('//@ sourceMappingURL=' + path.basename(mapFilePath));
    });
  };

  bundleFunc = function() {
    if (debug) {
      return bundler
        .bundle()
        .pipe(mold.transform(mapFileUrlComment))
        .pipe(source(file))
        .pipe(gulp.dest(dir));
    } else {
      return bundler
        .bundle()
        .pipe(source(file))
        .pipe(gulp.dest(dir));
    }
  };

  if (opts.watch) {
    bundler.on('update', bundleFunc);
  }

  bundler.transform(stringify(['.html']));

  if (opts.require) {
    opts.require.forEach(function(dependency) {
      bundler.require(dependency);
    });
  }

  if (opts.jquery) {
    bundler.require(
      opts.jquery,
      { expose: 'jquery-plugins', basedir: '' }
    );
  }

  if (opts.exclude) {
    opts.exclude.forEach(function(dependency) {
      bundler.exclude(dependency);
    });
  }

  return bundleFunc();
}

module.exports = {
  bundleJqueryPlugins: bundleJqueryPlugins,
  bundle: bundle
};
