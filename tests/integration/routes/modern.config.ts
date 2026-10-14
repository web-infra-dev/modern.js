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
      one: false,
      two: false,
      three: {
        mode: 'stream',
        loaderFailureMode: 'clientRender',
      },
      four: false,
      'lazy-errors': false,
      'loadable-errors': { mode: 'string' },
      'stream-errors': { mode: 'stream' },
    },
  },
  performance: {
    buildCache: false,
  },
});
