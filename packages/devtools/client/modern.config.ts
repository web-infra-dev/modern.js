import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { nanoid } from '@modern-js/utils';
import { ROUTE_BASENAME } from '@modern-js/devtools-kit/runtime';
import { ServiceWorkerCompilerPlugin } from './plugins/ServiceWorkerCompilerPlugin';
import packageMeta from './package.json';

const globalVars: Record<string, any> = {
  'process.env.VERSION': packageMeta.version,
  'process.env.PKG_VERSION': packageMeta.version,
  'process.env.DEVTOOLS_MARK': nanoid(),
};

if (process.env.NODE_ENV === 'production') {
  globalVars.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: ROUTE_BASENAME,
    },
  },
  dev: {
    assetPrefix: ROUTE_BASENAME,
    port: 8780,
  },
  source: {
    mainEntryName: 'client',
    entriesDir: './src/entries',
    entries: {
      mount: {
        entry: './src/entries/mount/index.tsx',
        disableMount: true,
      },
    },
    preEntry: [
      require.resolve('modern-normalize/modern-normalize.css'),
      require.resolve('@radix-ui/themes/styles.css'),
    ],
    globalVars,
    alias: {
      // Trick to fix: Modern.js won't recognize experimental react as react@18.
      react: path.resolve('./node_modules/react-exp'),
      'react-dom': path.resolve('./node_modules/react-dom-exp'),
    },
  },
  output: {
    assetPrefix: ROUTE_BASENAME,
    disableInlineRuntimeChunk: true,
    disableSourceMap: process.env.NODE_ENV === 'production',
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        cacheGroups: {
          components: {
            test: /\/src\/components\/.*\.(scss|css)$/,
            chunks: 'all',
            name: 'components',
            enforce: true,
            priority: 9999,
          },
        },
      },
    },
  },
  tools: {
    postcss: (config, { addPlugins }) => {
      addPlugins(require('postcss-custom-media'));
    },
    bundlerChain(chain) {
      chain.output.uniqueName('modernjsDevtools');
      chain.module
        .rule('RADIX_TOKEN')
        .test(require.resolve('@radix-ui/themes/styles.css'))
        .use('RADIX_TOKEN')
        .loader('./plugins/radix-token-transformer.js')
        .options({ root: '.theme-register' });
      chain
        .plugin('ServiceWorkerCompilerPlugin')
        .use(ServiceWorkerCompilerPlugin);
    },
  },
  plugins: [appTools({ bundler: 'experimental-rspack' })],
});
