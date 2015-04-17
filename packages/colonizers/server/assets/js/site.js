'use strict';

require('./jquery-plugins');

var $ = require('jquery');
var moment = require('moment');

// Date formatting

function formatDates() {
  $('span.date').each(function() {
    var $elem = $(this);
    var iso8601 = $elem.attr('title');
    var text = moment(iso8601).fromNow();

    if (text && $elem.text() !== text) {
      $elem.text(text);
    }
  });
}

// Form handling
function displayErrors($form, data) {

  $form.find('.form-group').removeClass('has-error');

  if (data && data.validation && data.validation.source === 'payload') {
    data.validation.keys.forEach(function(key) {
      var $field = $form.find('[name="' + key + '"]');
      $field.closest('.form-group').addClass('has-error');
    });
  }
}

$.fn.form = function(done, fail) {
  var $form = this;

  $form.on('submit', function(event) {
    event.preventDefault();

    var xhr = $.ajax({
      url: $form.attr('action'),
      type: $form.attr('method') || 'post',
      data: $form.serialize()
    });

    xhr.done(done);

    xhr.fail(function($xhr) {
      var data = $xhr.responseJSON;
      displayErrors($form, data);
    });

    if (fail) {
      xhr.fail(fail);
    }
  });
};

$(function() {
  formatDates();
  setInterval(formatDates, 5000);
});
