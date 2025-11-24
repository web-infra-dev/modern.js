import { createModuleFederationConfig } from '@module-federation/modern-js';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'i18nComponentProvider',
  filename: 'remoteEntry.js',
  exposes: {
    './Text': './src/components/Text.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: dependencies.react },
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
    'react-i18next': {
      singleton: true,
      requiredVersion: dependencies['react-i18next'],
    },
    i18next: {
      singleton: true,
      requiredVersion: dependencies.i18next,
    },
  },
});
