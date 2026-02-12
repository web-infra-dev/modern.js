import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const remotePort = process.env.RSC_MF_REMOTE_PORT || process.env.PORT || '3008';

export default defineConfig({
  server: {
    rsc: true,
  },
  // Keep RSC server entries synchronous for MF+RSC handlers.
  source: {
    enableAsyncEntry: false,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    assetPrefix: `http://127.0.0.1:${remotePort}`,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    bundlerChain(chain) {
      const target = chain.get('target');
      const targets = Array.isArray(target) ? target : [target];
      if (targets.some(item => String(item).includes('node'))) {
        chain.target('async-node');
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
