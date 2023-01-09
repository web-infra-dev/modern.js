import appTools, { defineConfig } from '@modern-js/app-tools';
import routerPlugin from '@modern-js/plugin-router-v5';

export default defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
  },
  plugins: [appTools(), routerPlugin()],
});
