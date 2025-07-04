import path from 'path';
import pluginRouterV7 from '@modern-js/plugin-router-v7';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [pluginRouterV7()],
  server: {
    rsc: true,
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
});
