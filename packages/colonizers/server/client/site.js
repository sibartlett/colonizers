'use strict';

require('jquery-plugins');

var jquery = require('jquery'),
    moment = require('moment');

function formatDates() {
  jquery('span.date').each(function() {
    var $elem = jquery(this),
        iso8601 = $elem.attr('title'),
        text = moment(iso8601).fromNow();

    if (text && $elem.text() !== text) {
      $elem.text(text);
    }
  });
}

formatDates();
setInterval(formatDates, 5000);
