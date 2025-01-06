import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    state: false,
    router: false,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
    rsc: true,
  },
  // source: {
  //   alias: {
  //     react: path.dirname(require.resolve('react')),
  //     'react-dom': path.dirname(require.resolve('react-dom')),
  //   },
  // },
  // source: {
  //   alias: {
  //     react: './node_modules/react',
  //     'react-dom': './node_modules/react-dom',
  //   },
  // },
  tools: {
    // webpack(config, { isServer }) {
    //   config.resolve.alias = {
    //     ...config.resolve.alias,
    //     react: path.resolve(__dirname, 'node_modules/react'),
    //     'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    //   };
    // },
    rspack(config, { isServer }) {
      if (!config.output) {
        config.output = {};
      }
      if (!isServer) {
        config.output.chunkFilename = 'static/js/async/[name].[contenthash].js';
      }
    },
    // babel(config, { modifyPresetReactOptions }) {
    //   modifyPresetReactOptions({
    //     runtime: 'automatic',
    //   });
    // },
  },
});
