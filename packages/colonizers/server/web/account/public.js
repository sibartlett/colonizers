'use strict';

window.run = ({ $, swal }) => {
  $('form').form(function() {
    swal({
      title: 'Account Updated',
      type: 'success'
    });
  });
};
