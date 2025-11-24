import { createModuleFederationConfig } from '@module-federation/modern-js';

export default createModuleFederationConfig({
  name: 'i18nAppProvider',
  filename: 'remoteEntry.js',
  exposes: {
    './export-app': './src/export-app.tsx',
  },
  bridge: {
    enableBridgeRouter: false,
  },
  shared: {
    react: { singleton: true },
    'react-dom': {
      singleton: true,
    },
    'react-i18next': {
      singleton: true,
    },
    i18next: {
      singleton: true,
    },
  },
});
