import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'nestedRouterTreeConsumer',
  remotes: {
    nestedRouterTreeProvider:
      'nestedRouterTreeProvider@http://localhost:4321/mf-manifest.json',
  },
  shared: {
    react: { singleton: true, requiredVersion: dependencies.react },
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
    'react-router': {
      singleton: true,
      requiredVersion: dependencies['react-router'],
    },
  },
});
