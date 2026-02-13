import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

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
        chain.module
          .rule('rsc-mf-host-runtime-react-alias')
          .resource(
            /packages[\\/]runtime[\\/]plugin-runtime[\\/]dist[\\/]esm[\\/]core[\\/].*\.mjs$/,
          )
          .resolve.alias.set('react$', require.resolve('react'))
          .set('react/jsx-runtime$', require.resolve('react/jsx-runtime'))
          .set(
            'react/jsx-dev-runtime$',
            require.resolve('react/jsx-dev-runtime'),
          );
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
