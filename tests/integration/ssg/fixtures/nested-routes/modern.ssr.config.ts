import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  server: { ssr: true },
  output: {
    ssgByEntries: {
      index: { routes: ['/blog', '/blog/hello', '/blog/scheduled'] },
    },
    polyfill: 'off',
    disableTsChecker: true,
  },
  plugins: [appTools(), ssgPlugin()],
});
