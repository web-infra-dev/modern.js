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
  server: {
    port,
  },
});
