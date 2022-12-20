import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import SSGPlugin from '@modern-js/plugin-ssg';
import ServerPlugin from '@modern-js/plugin-server';

export default defineConfig({
  output: {
    ssg: true,
  },
  plugins: [AppToolsPlugin(), SSGPlugin(), ServerPlugin()],
});
