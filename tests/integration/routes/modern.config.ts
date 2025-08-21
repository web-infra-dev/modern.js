import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  runtime: {
    router: true,
    state: false,
  },
  runtimeByEntries: {
    one: {
      router: false,
    },
  },
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
        disablePrerender: true,
        loaderFailureMode: 'clientRender',
      },
      four: false,
      rewrite: false,
    },
  },
});
