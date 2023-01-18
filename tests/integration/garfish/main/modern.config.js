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
          entry: 'http://localhost:4001/',
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
      // delete config.optimization?.runtimeChunk;
      // delete config.optimization?.splitChunks;
    },
  },
  plugins: [appTools(), routerPlugin(), garfishPlugin()],
});
