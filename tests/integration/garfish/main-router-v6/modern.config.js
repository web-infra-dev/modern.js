import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
// import RouterPlugin from '@modern-js/runtime/dist/js/modern/router/cli';
import GarfishPlugin from '@modern-js/plugin-garfish';

import { getPort, getPublicPath } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-main-router-v6');

module.exports = defineConfig({
  runtime: {
    router: true,
    state: false,
    masterApp: {
      apps: [
        {
          name: 'Dashboard',
          entry: getPublicPath('@cypress-test/garfish-dashboard'),
        },
        {
          name: 'TableList',
          activeWhen: '/tablelist',
          entry: `${getPublicPath('@cypress-test/garfish-table')}index.js`,
        },
      ],
      props: {
        world: 'hello',
      },
    },
  },
  source: {
    enableAsyncEntry: true,
  },
  server: {
    port,
  },
  plugins: [
    AppToolsPlugin(),
    // RouterPlugin(),
    GarfishPlugin()
  ]
});
