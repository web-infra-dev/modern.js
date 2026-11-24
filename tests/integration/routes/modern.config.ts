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
      'memory-csr': false,
      'memory-ssr': {
        mode: 'stream',
      },
    },
  },
  performance: {
    buildCache: false,
  },
});
