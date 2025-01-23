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
  output: {
    minify: false,
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
    rspack(config, { isServer }) {
      if (!config.output) {
        config.output = {};
      }
      if (!isServer) {
        config.output.chunkFilename = 'static/js/async/[name].[contenthash].js';
      }
    },
  },
});
