import path from 'path';
import { moduleFederationPlugin } from '@module-federation/modern-js-rsc';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  dev: {
    port: Number(process.env.PORT) || 3002,
  },
  runtime: {
    state: false,
    router: false,
  },
  server: {
    port: Number(process.env.PORT) || 3002,
    ssr: {
      mode: 'stream',
    },
    rsc: true,
  },
  output: {
    minify: false,
    assetPrefix: process.env.ASSET_PREFIX || 'http://localhost:3002',
  },
  plugins: [moduleFederationPlugin()],
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
});
