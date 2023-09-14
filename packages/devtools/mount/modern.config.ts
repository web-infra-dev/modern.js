import { nanoid } from 'nanoid';
import { appTools, defineConfig } from '@modern-js/app-tools';
import packageMeta from './package.json';

const DEVTOOLS_MARK = nanoid();

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  source: {
    entries: {
      main: {
        entry: './src/index.tsx',
        disableMount: true,
      },
    },
    globalVars: {
      'process.env.VERSION': packageMeta.version,
      'process.env.DEVTOOLS_MARK': DEVTOOLS_MARK,
    },
  },
  output: {
    copy: [{ from: './src/types.d.ts', to: './' }],
    legalComments: 'linked',
    disableCssExtract: true,
    disableFilenameHash: true,
    enableCssModuleTSDeclaration: true,
    distPath: {
      js: './',
    },
  },
  dev: {
    port: 8781,
  },
  tools: {
    htmlPlugin: process.env.NODE_ENV === 'production' ? false : {},
    styleLoader: {
      insert: function insert(element) {
        const key = `__DEVTOOLS_STYLE_${process.env.DEVTOOLS_MARK}`;
        // @ts-expect-error
        window[key] = window[key] || [];
        // @ts-expect-error
        window[key].push(element);
      },
    },
    bundlerChain(chain) {
      chain.output.libraryTarget('commonjs');
      chain.module
        .rule('RADIX_TOKEN')
        .test(/\/@radix-ui\/themes\/styles.css/)
        .use('RADIX_TOKEN')
        .loader('./plugin/radix-token-transformer.js')
        .options({ root: '._modern_js_devtools_mountpoint' });
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
  ],
});
