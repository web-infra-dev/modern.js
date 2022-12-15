import { defineConfig } from '@modern-js/app-tools';
import PluginTest from '@modern-js/plugin-testing';

export default defineConfig({
  runtime: {
    state: true,
  },
  plugins: [PluginTest()],
});
