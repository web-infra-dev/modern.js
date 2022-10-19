// mini-css-extract-plugin test
const FriendlyErrorsWebpackPlugin = require('../../../index');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: __dirname + "/index.scss",
  output: {
    path: __dirname + "/dist",
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(s*)css$/,
        exclude: /node_modules/,
        use: [
           MiniCssExtractPlugin.loader,
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
            }
          },
        ],
      }
    ]
  },
};