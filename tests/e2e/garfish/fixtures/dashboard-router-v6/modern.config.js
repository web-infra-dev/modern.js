import { garfishPlugin } from '@modern-js/plugin-garfish';
import { swcPlugin } from '@modern-js/plugin-swc';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
import { getPort } from '../../testUtils';

module.exports = applyBaseConfig({
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
  plugins: [garfishPlugin(), swcPlugin()],
});
