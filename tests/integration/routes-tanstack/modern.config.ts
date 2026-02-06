import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    minify: false,
  },
  server: {
    ssrByEntries: {
      string: {
        mode: 'string',
      },
      stream: {
        mode: 'stream',
      },
    },
  },
  performance: {
    buildCache: false,
  },
});

