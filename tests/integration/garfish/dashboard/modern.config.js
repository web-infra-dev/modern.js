import appTools, { defineConfig } from '@modern-js/app-tools';
import garfishPlugin from '@modern-js/plugin-garfish';
import routerPlugin from '@modern-js/plugin-router-v5';
import { getPort } from '../../../utils/testCase';

module.exports = defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
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
            './share-button': './src/ShareButton.tsx',
          },
        }),
      ]);
      delete config.optimization?.runtimeChunk;
      delete config.optimization?.splitChunks;
    },
  },
  plugins: [appTools(), routerPlugin(), garfishPlugin()],
  // dev: {
  //   withMasterApp: {
  //     moduleApp: 'http://localhost:8080/',
  //     moduleName: 'Dashboard',
  //   },
  // },
});
