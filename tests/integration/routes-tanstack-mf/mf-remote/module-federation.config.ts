import { createModuleFederationConfig } from '@module-federation/modern-js';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'tanstackRemote',
  filename: 'remoteEntry.js',
  exposes: {
    './Widget': './src/components/Widget.tsx',
    './Mutator': './src/components/Mutator.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: dependencies.react },
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
    '@tanstack/react-router': {
      singleton: true,
      requiredVersion: dependencies['@tanstack/react-router'],
    },
    '@modern-js/runtime': {
      singleton: true,
      requiredVersion: dependencies['@modern-js/runtime'],
    },
  },
});
