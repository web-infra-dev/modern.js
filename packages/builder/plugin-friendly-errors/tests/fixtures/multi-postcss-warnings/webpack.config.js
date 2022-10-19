// postcss-loader warnings test (multi-compiler version)
const FriendlyErrorsWebpackPlugin = require('../../../index');

const COMMON_CONFIG = {
  mode: 'production',
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

module.exports = [
  Object.assign({}, { entry: __dirname + '/index.css' }, COMMON_CONFIG),
  Object.assign({}, { entry: __dirname + '/index2.css' }, COMMON_CONFIG),
];