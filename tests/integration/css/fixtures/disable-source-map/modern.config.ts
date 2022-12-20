import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableSourceMap: true,
  },
  plugins: [AppToolsPlugin()],
});
