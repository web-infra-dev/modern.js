import { garfishPlugin } from '@modern-js/plugin-garfish';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { swcPlugin } from '@modern-js/plugin-swc';
import { getPort } from '../../testUtils';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

module.exports = applyBaseConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
    state: true,
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: false,
      externalBasicLibrary: true,
    },
  },
  dev: {
    withMasterApp: {
      moduleApp: 'http://localhost:8080/',
      moduleName: 'Dashboard',
    },
  },
  output: {
    disableTsChecker: true,
    polyfill: 'off',
  },
  server: {
    port: getPort('@e2e/garfish-table'),
  },
  plugins: [garfishPlugin(), routerPlugin(), swcPlugin()],
});
