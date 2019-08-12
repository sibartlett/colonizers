'use strict';

window.run = ({ $, swal }) => {
  $('form').form(function(room) {
    swal({
      title: 'Room created',
      text: 'Taking you there now...',
      type: 'success'
    });
    setTimeout(function() {
      window.location = '/room/' + room.id;
    }, 2000);
  });
};
