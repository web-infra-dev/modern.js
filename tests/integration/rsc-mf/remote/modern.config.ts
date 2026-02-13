import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const remotePort = process.env.RSC_MF_REMOTE_PORT || process.env.PORT || '3008';
const enableRemoteServeSsr = Boolean(process.env.PORT);
const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve('server-only')),
  'empty.js',
);
const reactServerDomClientBrowserPath = require.resolve(
  'react-server-dom-rspack/client.browser',
);

export default defineConfig({
  server: {
    rsc: true,
    ssr: enableRemoteServeSsr,
    port: Number(remotePort),
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
      chain.resolve.alias.set(
        'rsc-mf-react-server-dom-client-browser$',
        reactServerDomClientBrowserPath,
      );
      if (targets.some(item => String(item).includes('node'))) {
        chain.target('async-node');
        chain.resolve.conditionNames
          .clear()
          .add('require')
          .add('import')
          .add('default');
        chain.resolve.alias.set('server-only$', serverOnlyEmptyPath);
        chain.output.publicPath(`http://127.0.0.1:${remotePort}/bundles/`);
        chain.module
          .rule('rsc-mf-remote-components-layer')
          .test(/src[\\/]components[\\/].*\.[tj]sx?$/)
          .layer('react-server-components');
      } else {
        chain.optimization.splitChunks(false);
        chain.output.chunkLoadingGlobal('chunk_rscHost');
        chain.output.publicPath(`http://127.0.0.1:${remotePort}/`);
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
