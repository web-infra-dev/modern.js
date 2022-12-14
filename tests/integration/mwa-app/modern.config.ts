import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [PluginAppTools()],
  runtime: {
    state: true,
  },
  output: {
    disableTsChecker: true,
  },
});
