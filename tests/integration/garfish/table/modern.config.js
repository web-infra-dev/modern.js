import { defineConfig } from '@modern-js/app-tools';
import { getPort } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-table');

module.exports = defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: false,
      externalBasicLibrary: true,
    },
  },
  server: {
    port,
  },
  dev: {
    withMasterApp: {
      moduleApp: 'http://localhost:8080/',
      moduleName: 'Dashboard',
    },
  },
});
