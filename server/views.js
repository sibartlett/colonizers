'use strict';

var Handlebars = require('handlebars');

module.exports = function(server, isProd) {

  Handlebars.registerHelper('json', function(obj) {
    return new Handlebars.SafeString(JSON.stringify(obj));
  });

  Handlebars.registerHelper('isoFormat', function(date) {
    return date ? date.toISOString() : '';
  });

  server.views({
    relativeTo: __dirname,
    path: './web',
    layout: true,
    layoutPath: './web',

    engines: {
      html: {
        module: Handlebars,
        isCached: isProd
      }
    }
  });

};
