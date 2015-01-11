'use strict';

var staticPath = __dirname + '/../public/',
    viewPath = __dirname + '/view.html';

function handleRequest(req, res) {
  res.render(viewPath, {
    layout: null,
    roomId: req.param('id'),
    userId: req.user._id
  });
}

module.exports = {
  staticPath: staticPath,
  handleRequest: handleRequest
};
