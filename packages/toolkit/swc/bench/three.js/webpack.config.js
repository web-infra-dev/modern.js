const { join } = require('path')
const {InspectorWebpackPlugin} = require('@modern-js/inspector-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { SwcMinifyPlugin } = require('../../dist/plugin.js')


module.exports = {
  mode: 'production',
  entry: { index: './src/index.js' },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /core-js/,
        use: {
        //   loader: 'babel-loader',
        //   options: {
        //     targets: 'ie 11',
        //     presets: [
        //       [
        //         '@babel/preset-env',
        //         {
        //           useBuiltIns: 'usage',
        //           corejs: '3.22',
        //         },
        //       ],
        //     ],
        //   },

          loader: '../../dist/loader.js',
          options: {
            swc: {
              module: {},
              jsc: {
                externalHelpers: true,
              },
              env: {
                targets: 'ie 11',
                mode: 'usage',
                coreJs: '3.22',
              },
            },
            extensions: {
              pluginImport: [
                {
                  fromSource: ""
                }
              ]
            }
          },
        },
      },
    ],
  },
  devtool: 'source-map',
  optimization: {
    minimize: false,
    minimizer: [
      // new TerserPlugin({
      //   minify: TerserPlugin.terserMinify,
      //   // `terserOptions` options will be passed to `swc` (`@swc/core`)
      //   // Link to options - https://swc.rs/docs/config-js-minify
      //   terserOptions: {
      //     mangle:true,
      //     compress: {},
      //   },
      // }),
    ],
  },
  output: {
    path: join(process.cwd(), './dist'),
    library: {
      type: 'umd',
    },
  },
  plugins: [
    // new InspectorWebpackPlugin({ port: 3333 }),
    new SwcMinifyPlugin({}),
  ],
};
