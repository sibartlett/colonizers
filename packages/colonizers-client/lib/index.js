'use strict';

function Client(options) {
  this.options = options;

  this.staticPaths = [__dirname + '/../public/'];
  this.viewPath = __dirname + '/view.html';

  if (this.options.tilesets) {
    this.staticPaths.push(this.options.tilesets.staticPath);
  }

  this.handleRequest = this.handleRequest.bind(this);
}

Client.prototype.handleRequest = function(req, res) {
  res.render(this.viewPath, {
    layout: null,
    roomId: req.param('id'),
    userId: req.user._id
  });
};

module.exports = Client;
