'use strict';

var $ = require('jquery');
var swal = require('sweetalert');

$(function() {
  $('form').form(function() {
    swal({
      title: 'Account Updated',
      type: 'success'
    });
  });
});
