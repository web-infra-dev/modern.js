import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  output: {
    disableFilenameHash: true,
    disableInlineRuntimeChunk: true,
  },
  plugins: [PluginAppTools()],
});
