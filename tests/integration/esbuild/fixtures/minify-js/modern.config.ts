import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    esbuild: {},
  },
  plugins: [AppToolsPlugin()],
});
