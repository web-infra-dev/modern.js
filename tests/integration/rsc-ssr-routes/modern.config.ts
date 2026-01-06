import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    rsc: true,
    ssr: {
      mode: 'stream',
    },
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
    rspack(config, { appendPlugins }) {
      config.optimization.sideEffects = false;
      config.optimization.realContentHash = false;
    },
  },
});
