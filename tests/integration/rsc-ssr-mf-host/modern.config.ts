import path from 'path';
import { moduleFederationPlugin } from '@module-federation/modern-js-rsc';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  dev: {
    port: 3001,
  },
  server: {
    port: 3001,
    ssr: true,
    rsc: true,
  },
  output: {
    assetPrefix: 'http://localhost:3001',
  },
  runtime: {
    router: false,
    state: false,
  },
  source: {
    enableAsyncEntry: false,
    entries: {
      main: 'src/App.tsx',
    },
    disableDefaultEntries: true,
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
