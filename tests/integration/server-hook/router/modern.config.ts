import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import ServerPlugin from '@modern-js/plugin-server';

export default defineConfig({
  plugins: [AppToolsPlugin(), ServerPlugin()],
  runtime: {
    router: false,
    state: false,
  },
  server: {
    routes: {
      home: '/rewrite',
      entry: '/redirect',
    },
  },
});
