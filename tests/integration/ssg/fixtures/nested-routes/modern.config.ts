import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
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
          '/blog',
          '/blog/hello',
          '/blog/scheduled',
        ],
      },
    },
    ssg: false,
    polyfill: 'off',
    disableTsChecker: true,
  },
  splitChunks: false,
  plugins: [appTools(), ssgPlugin()],
});
