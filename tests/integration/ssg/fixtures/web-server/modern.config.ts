import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginSSG from '@modern-js/plugin-ssg';
import PluginServer from '@modern-js/plugin-server';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [PluginAppTools(), PluginSSG(), PluginServer()],
});
