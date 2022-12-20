import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import RouterLegacyPlugin from '@modern-js/plugin-router-v5';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    // router: true,
    router: {
      mode: 'react-router-5',
    },
    state: true,
  },
  source: {
    entries: {
      sub: './src/sub/App.tsx',
      test: './src/test/App.tsx',
    },
  },
  server: {
    ssrByEntries: {
      test: true,
    },
  },
  html: {
    favicon: './static/a.icon',
  },
  output: {},
  plugins: [AppToolsPlugin(), RouterLegacyPlugin()],
});
