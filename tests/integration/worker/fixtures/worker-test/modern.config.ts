import appTools, { defineConfig } from '@modern-js/app-tools';
import workPlugin from '@modern-js/plugin-worker';

export default defineConfig({
  runtime: {
    router: true,
  },
  output: {
    disableMinimize: true,
  },
  server: {
    ssrByEntries: {
      main: true,
    },
    worker: true,
  },
  plugins: [appTools(), workPlugin()],
});
