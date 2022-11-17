import { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    // router: true,
    router: {
      legacy: true,
    },
    state: true,
  },
  source: {
    entries: {
      sub: './src/sub/App2.tsx',
      test: './src/test/App.tsx',
    },
  },
  server: {
    ssrByEntries: {
      test: true,
    },
  },
  output: {
    favicon: './static/a.icon',
  },
});
