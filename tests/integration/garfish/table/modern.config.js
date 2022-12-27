import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import GarfishPlugin from '@modern-js/plugin-garfish';
import RouterPlugin from '@modern-js/plugin-router-v5';
import { getPort } from '../../../utils/testCase';

const port = getPort('@cypress-test/garfish-table');

module.exports = defineConfig({
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
  server: {
    port,
  },
  dev: {
    withMasterApp: {
      moduleApp: 'http://localhost:8080/',
      moduleName: 'Dashboard',
    },
  },
  plugins: [AppToolsPlugin(), GarfishPlugin(), RouterPlugin()],
});
