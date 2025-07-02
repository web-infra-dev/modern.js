import { appTools, defineConfig } from '@modern-js/app-tools';
import routerPlugin from '@modern-js/plugin-router-v7';

const bundler = process.env.BUNDLER;

export default defineConfig({
  plugins: [
    appTools({
      bundler: bundler === 'webpack' ? 'webpack' : 'rspack',
    }),
    routerPlugin(),
  ],
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
    },
  },
});
