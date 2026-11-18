import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

const scenario = process.env.SSG_PARAMS_SCENARIO;

export default defineConfig({
  source: {
    entriesDir: './params-src',
    entries:
      scenario === 'multi-entry'
        ? { secondary: './params-src/secondary' }
        : undefined,
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
          ? {
              routes: [
                '/about',
                '/blog/en/explicit',
                {
                  url: '/blog/en/hello/',
                  headers: { 'x-ssg-variant': 'preview' },
                  output: 'custom/hello.html',
                },
              ],
            }
          : scenario === 'multi-entry'
            ? true
            : { routes: [] },
    polyfill: 'off',
    disableTsChecker: true,
  },
  server: { baseUrl: '/prefix', ssr: scenario === 'disabled' },
  plugins: [appTools(), ssgPlugin()],
});
