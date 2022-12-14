import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginSWC from '@modern-js/plugin-swc';

export default defineConfig({
  tools: {
    swc: {},
  },
  plugins: [PluginAppTools(), PluginSWC()],
});
