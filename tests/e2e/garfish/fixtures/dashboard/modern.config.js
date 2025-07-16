import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { getPort } from '../../testUtils';

module.exports = defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
      externalBasicLibrary: false,
    },
  },
  output: {
    disableTsChecker: true,
    polyfill: 'off',
  },
  source: {
    enableAsyncEntry: true,
  },
  server: {
    port: getPort('@e2e/garfish-dashboard'),
  },
  plugins: [
    appTools({
      bundler: 'rspack',
    }),
    routerPlugin(),
    garfishPlugin(),
  ],
});
