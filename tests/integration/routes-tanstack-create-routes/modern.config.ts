import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
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
