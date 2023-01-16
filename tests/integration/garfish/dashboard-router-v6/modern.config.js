import appTools, { defineConfig } from '@modern-js/app-tools';
// import routerPlugin from '@modern-js/runtime/dist/js/modern/router/cli';
import garfishPlugin from '@modern-js/plugin-garfish';

import { getPort } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-main-router-v6');

module.exports = defineConfig({
  runtime: {
    router: true,
    state: false,
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
      externalBasicLibrary: false,
    },
  },
  source: {
    enableAsyncEntry: true,
  },
  server: {
    port,
  },
  plugins: [
    appTools(),
    // routerPlugin(),
    garfishPlugin(),
  ],
});
