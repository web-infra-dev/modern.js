import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import SSGPlugin from '@modern-js/plugin-ssg';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [AppToolsPlugin(), SSGPlugin()],
});
