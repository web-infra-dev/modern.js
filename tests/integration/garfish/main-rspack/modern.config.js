import appTools, { defineConfig } from '@modern-js/app-tools';
import garfishPlugin from '@modern-js/plugin-garfish';
import routerPlugin from '@modern-js/plugin-router-v5';

import { getPort, getPublicPath } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-main');

module.exports = defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
      supportHtml5History: true,
      historyOptions: {
        basename: '/test',
      },
    },
    // state: true,
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
    alias: {
      '@modern-js/runtime/garfish': '@modern-js/plugin-garfish/runtime',
    },
  },
  server: {
    port,
  },
  plugins: [
    appTools({
      bundler:
        process.env.PROVIDE_TYPE === 'rspack'
          ? 'experimental-rspack'
          : 'webpack',
    }),
    routerPlugin(),
    garfishPlugin(),
  ],
});
