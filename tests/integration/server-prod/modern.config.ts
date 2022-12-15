import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
  plugins: [PluginAppTools()],
});
