import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { swcPlugin } from '@modern-js/plugin-swc';

import { getPort, getPublicPath } from '../../testUtils';

module.exports = defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
      supportHtml5History: true,
      historyOptions: {
        basename: '/test',
      },
    },
    masterApp: {
      apps: [
        {
          name: 'Dashboard',
          entry: getPublicPath('@e2e/garfish-dashboard'),
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
    alias: {
      '@modern-js/runtime/garfish': '@modern-js/plugin-garfish/runtime',
    },
  },
  tools: {
    webpack: (config, { appendPlugins, webpack }) => {
      const { ModuleFederationPlugin } = webpack.container;
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'main',
          remotes: {
            dashboardApp: 'dashboard@http://localhost:3002/remoteEntry.js',
          },
        }),
      ]);
    },
  },
  output: {
    disableTsChecker: true,
    polyfill: 'off',
  },
  server: {
    port: getPort('@e2e/garfish-main'),
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
    swcPlugin(),
  ],
});
