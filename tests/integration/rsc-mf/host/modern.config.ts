import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve('server-only')),
  'empty.js',
);
const remoteOrigin = `http://127.0.0.1:${process.env.RSC_MF_REMOTE_PORT || '3008'}`;

export default defineConfig({
  server: {
    rsc: true,
    port: Number(process.env.PORT || 3007),
  },
  // Keep RSC server entries synchronous for MF+RSC handlers.
  source: {
    enableAsyncEntry: false,
    define: {
      __RSC_MF_REMOTE_ORIGIN__: JSON.stringify(remoteOrigin),
    },
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
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
        chain.resolve.conditionNames
          .clear()
          .add('require')
          .add('import')
          .add('default');
        chain.resolve.alias.set('server-only$', serverOnlyEmptyPath);
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
