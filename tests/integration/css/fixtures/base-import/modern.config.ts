import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [PluginAppTools()],
  output: {
    disableSourceMap: false,
  },
});
