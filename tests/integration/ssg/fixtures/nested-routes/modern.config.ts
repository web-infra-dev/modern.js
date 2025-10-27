import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  runtime: {
    router: true,
  },
  output: {
    ssgByEntries: {
      index: {
        routes: [
          '/user',
          {
            url: '/',
            headers: {
              cookies: 'name=modernjs',
            },
          },
          '/user/1',
        ],
      },
    },
    ssg: false,
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
