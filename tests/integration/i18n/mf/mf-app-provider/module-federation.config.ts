import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'i18nAppProvider',
  filename: 'remoteEntry.js',
  exposes: {
    './export-app': './src/i18n-mf-app-provider/export-app.tsx',
    './export-app-custom': './src/custom/export-app.tsx',
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
