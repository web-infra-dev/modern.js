import appTools, { defineConfig } from '@modern-js/app-tools';
import workPlugin from '@modern-js/plugin-worker';
// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
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
