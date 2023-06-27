const path = require('path');

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
};
