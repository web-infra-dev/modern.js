import { defineConfig } from '@modern-js/app-tools';
import { getPort } from '../../../utils/testCase';

module.exports = defineConfig({
  runtime: {
    router: {},
    // state: true,
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
  server: {
    port: getPort('@cypress-test/garfish-dashboard'),
  },
  tools: {
    webpack: (config, { appendPlugins, webpack }) => {
      const { ModuleFederationPlugin } = webpack.container;
      appendPlugins([
        new ModuleFederationPlugin({
          filename: 'remoteEntry.js',
          name: 'dashboard',
          exposes: {
            '.': './src/App.tsx',
          },
        }),
      ]);
      delete config.optimization?.runtimeChunk;
      delete config.optimization?.splitChunks;
    },
  },
  // dev: {
  //   withMasterApp: {
  //     moduleApp: 'http://localhost:8080/',
  //     moduleName: 'Dashboard',
  //   },
  // },
});
