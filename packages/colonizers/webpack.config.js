const path = require('path');
const webpack = require('webpack');

const contentBase = path.join(__dirname, 'dist');

module.exports = {
  mode: 'development',
  entry: {
    game: './server/web/room/game.js',
    room: './server/web/room/room.js',
    site: './server/assets/js/site.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: contentBase
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: 'raw-loader'
      }
    ]
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /html-templates.js/,
      'html-templates.webpack.js'
    )
  ],
  devServer: {
    contentBase,
    compress: true,
    overlay: true,
    port: 5000,
    proxy: [
      {
        context: '/',
        target: 'http://localhost:3000'
      }
    ],
    publicPath: '/bundles/'
  }
};
