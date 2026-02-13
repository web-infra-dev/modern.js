import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const remotePort = process.env.RSC_MF_REMOTE_PORT || process.env.PORT || '3008';
const enableRemoteServeSsr = Boolean(process.env.PORT);

export default defineConfig({
  server: {
    rsc: true,
    ssr: enableRemoteServeSsr,
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
        chain.resolve.conditionNames
          .clear()
          .add('react-server')
          .add('require')
          .add('import')
          .add('default');
        chain.module
          .rule('rsc-mf-ssr-no-react-server')
          .test(/\.[cm]?[jt]sx?$/)
          .issuerLayer('server-side-rendering')
          .resolve.conditionNames.clear()
          .add('require')
          .add('import')
          .add('default');
        chain.output.publicPath(`http://127.0.0.1:${remotePort}/bundles/`);
        chain.module
          .rule('rsc-mf-remote-components-layer')
          .test(/src[\\/]components[\\/].*\.[tj]sx?$/)
          .layer('react-server-components');
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
