import { garfishPlugin } from '@modern-js/plugin-garfish';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { swcPlugin } from '@modern-js/plugin-swc';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

import { getPort, getPublicPath } from '../../testUtils';

module.exports = applyBaseConfig({
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
  plugins: [routerPlugin(), garfishPlugin(), swcPlugin()],
});
