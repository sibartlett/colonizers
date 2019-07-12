'use strict';

var $ = require('jquery');
var swal = require('sweetalert');

$(function() {
  $('form.login').form(
    function() {
      swal({
        title: 'Logged in',
        text: 'Taking you there now...',
        type: 'success'
      });
      setTimeout(function() {
        window.location = '/';
      }, 2000);
    },

    function($xhr) {
      var data = $xhr.responseJSON;
      if (data && data.message) {
        swal({
          title: 'Login failed',
          text: data.message,
          type: 'error'
        });
      }
    }
  );

  $('form.signup').form(function() {
    swal({
      title: 'Registered',
      text: 'Please try signing in',
      type: 'success'
    });

    $('form.signup input').val('');
  });
});
