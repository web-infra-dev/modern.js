import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginSSG from '@modern-js/plugin-ssg';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [PluginAppTools(), PluginSSG()],
});
