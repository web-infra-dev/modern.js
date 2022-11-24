import { defineConfig } from '@modern-js/app-tools';
import { getPort, getPublicPath } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-main');

module.exports = defineConfig({
  runtime: {
    router: {
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
});
