import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish';
import { swcPlugin } from '@modern-js/plugin-swc';
import { getPort } from '../../testUtils';

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
  output: {
    disableTsChecker: true,
    polyfill: 'off',
  },
  server: {
    port: getPort('@e2e/garfish-dashboard-router-v6'),
  },
  plugins: [
    appTools({
      bundler:
        process.env.PROVIDE_TYPE === 'rspack'
          ? 'experimental-rspack'
          : 'webpack',
    }),
    garfishPlugin(),
    swcPlugin(),
  ],
});
