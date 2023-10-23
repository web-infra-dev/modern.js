import { garfishPlugin } from '@modern-js/plugin-garfish';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { swcPlugin } from '@modern-js/plugin-swc';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
import { getPort } from '../../testUtils';

module.exports = applyBaseConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
      externalBasicLibrary: false,
    },
  },
  output: {
    disableTsChecker: true,
    polyfill: 'off',
  },
  source: {
    enableAsyncEntry: true,
  },
  server: {
    port: getPort('@e2e/garfish-dashboard'),
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
  plugins: [routerPlugin(), garfishPlugin(), swcPlugin()],
});
