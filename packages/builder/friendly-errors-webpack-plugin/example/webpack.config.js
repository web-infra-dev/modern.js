const path = require('path');
// const { FriendlyErrorsWebpackPlugin } = require('@modern-js/friendly-errors-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  entry: [
    './src/index.js',
    './src/moduleParseError.js'
  ].map(f => path.resolve(__dirname, f)),
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false,
  },
  cache: false,
  stats: {
    errors: false,
  },
  devtool: 'source-map',
  // plugins: [new FriendlyErrorsWebpackPlugin()],
};
