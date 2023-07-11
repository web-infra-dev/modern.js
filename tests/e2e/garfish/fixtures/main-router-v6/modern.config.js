import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish';
import { swcPlugin } from '@modern-js/plugin-swc';
import { getPort, getPublicPath } from '../../testUtils';

const port = getPort('@e2e/garfish-main-router-v6');

module.exports = defineConfig({
  runtime: {
    router: true,
    state: false,
    masterApp: {
      apps: [
        {
          name: 'Dashboard',
          entry: getPublicPath('@e2e/garfish-dashboard-router-v6'),
        },
        {
          name: 'TableList',
          activeWhen: '/tablelist',
          entry: `${getPublicPath('@e2e/garfish-table')}index.js`,
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
  output: {
    disableTsChecker: true,
    polyfill: 'off',
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
    garfishPlugin(),
    swcPlugin(),
  ],
});
