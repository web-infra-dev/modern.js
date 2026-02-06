import { createModuleFederationConfig } from '@module-federation/modern-js';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'tanstackHost',
  remotes: {
    remote: 'tanstackRemote@http://localhost:3010/mf-manifest.json',
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
