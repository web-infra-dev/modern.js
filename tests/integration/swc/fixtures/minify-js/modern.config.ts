import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    swc: {},
  },
  plugins: [AppToolsPlugin()],
});
