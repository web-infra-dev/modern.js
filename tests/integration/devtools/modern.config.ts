import { devtoolsPlugin } from '@modern-js/plugin-devtools';
import { defineConfig, appTools } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
  },
  source: {
    mainEntryName: 'main',
    preEntry: ['./src/prelude.css'],
  },
  output: {
    // disable polyfill and ts checker to make test faster
    polyfill: 'off',
    disableTsChecker: true,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    devServer: {},
  },
  plugins: [appTools(), devtoolsPlugin()],
});
