import { appTools, defineConfig } from '@modern-js/app-tools';
import { ROUTE_BASENAME } from '@modern-js/devtools-kit';
import packageMeta from './package.json';

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
    entries: {
      mount: {
        entry: './src/mount/index.tsx',
        disableMount: true,
      },
    },
    preEntry: [
      require.resolve('modern-normalize/modern-normalize.css'),
      require.resolve('@radix-ui/themes/styles.css'),
    ],
    globalVars: {
      'process.env.VERSION': packageMeta.version,
      'process.env.PKG_VERSION': packageMeta.version,
      'process.env.DEVTOOLS_MARK': 'friw89',
    },
  },
  output: {
    assetPrefix: ROUTE_BASENAME,
  },
  tools: {
    postcss: (config, { addPlugins }) => {
      addPlugins(require('postcss-custom-media'));
    },
    bundlerChain(chain) {
      chain.module
        .rule('RADIX_TOKEN')
        .test(/\/@radix-ui\/themes\/styles\.css/)
        .use('RADIX_TOKEN')
        .loader('./plugins/radix-token-transformer.js')
        .options({ root: '.theme-register' });
    },
  },
  plugins: [appTools({ bundler: 'experimental-rspack' })],
});
