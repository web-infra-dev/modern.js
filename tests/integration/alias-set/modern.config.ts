import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    alias: {
      '@common': './src/common',
      '@components': './src/components',
    },
  },
  runtime: {},
  plugins: [PluginAppTools()],
});
