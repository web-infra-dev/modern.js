// postcss-loader warnings test
const FriendlyErrorsWebpackPlugin = require('../../../index');

module.exports = {
  mode: 'production',
  entry: __dirname + '/index.css',
  output: {
    path: __dirname + '/dist',
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: __dirname + '/postcss.config.js'
              }
            },
          },
        ],
      }
    ]
  },
};