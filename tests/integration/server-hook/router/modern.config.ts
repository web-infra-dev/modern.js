import appTools, { defineConfig } from '@modern-js/app-tools';
import serverPlugin from '@modern-js/plugin-server';

export default defineConfig({
  plugins: [appTools(), serverPlugin()],
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
