import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

const scenario = process.env.SSG_PARAMS_SCENARIO;

export default defineConfig({
  source: {
    entriesDir: './params-src',
    enableAsyncEntry: scenario !== 'explicit',
    alias: {
      '@posts': './params-src/posts.ts',
    },
  },
  output: {
    distPath: { root: 'dist-ssg' },
    ssg:
      scenario === 'disabled'
        ? false
        : scenario === 'explicit'
          ? { routes: ['/blog/en/explicit'] }
          : { routes: [] },
    polyfill: 'off',
    disableTsChecker: true,
  },
  server: { baseUrl: '/prefix', ssr: scenario === 'disabled' },
  plugins: [appTools(), ssgPlugin()],
});
