import { appTools, defineConfig } from '@modern-js/app-tools';
import { tanstackRouterPlugin } from '@modern-js/plugin-tanstack';

export default defineConfig({
  plugins: [appTools(), tanstackRouterPlugin()],
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    minify: false,
  },
  server: {
    ssr: {
      mode: 'string',
    },
  },
  performance: {
    buildCache: false,
  },
});
