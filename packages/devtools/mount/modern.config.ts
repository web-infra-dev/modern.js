import { appTools, defineConfig } from '@modern-js/app-tools';
import packageMeta from './package.json';

// const isDevelopment = process.env.NODE_ENV === 'development';

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
    },
  },
  output: {
    legalComments: 'linked',
    disableFilenameHash: true,
    distPath: {
      js: './',
    },
  },
  dev: {
    port: 8781,
  },
  tools: {
    htmlPlugin: process.env.NODE_ENV === 'production' ? false : {},
    bundlerChain(chain) {
      chain.output.libraryTarget('commonjs');
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
