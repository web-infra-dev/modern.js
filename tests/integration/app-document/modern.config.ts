import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginRouterLegacy from '@modern-js/plugin-router-legacy';

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
  plugins: [PluginAppTools(), PluginRouterLegacy()],
});
