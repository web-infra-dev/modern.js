import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import plugin1 from './plugins/cliPlugin';

export default defineConfig({
  plugins: [PluginAppTools(), plugin1()],
});
