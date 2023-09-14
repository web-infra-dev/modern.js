import { defineConfig, appTools } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  runtime: {
    router: true,
  },
  output: {
    ssg: true,
    polyfill: 'off',
    disableTsChecker: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  plugins: [appTools(), ssgPlugin()],
});
