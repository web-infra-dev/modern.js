import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  output: {
    ssg: {
      routes: Array.from(Array(10_000)).map((_, id) => ({
        url: `/user/${id}`,
      })),
    },
    polyfill: 'off',
    disableTsChecker: true,
  },
  splitChunks: false,
  plugins: [appTools(), ssgPlugin()],
});
