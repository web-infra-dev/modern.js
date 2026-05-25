import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'nestedRouterTreeConsumer',
  remotes: {
    nestedRouterTreeProvider:
      'nestedRouterTreeProvider@http://localhost:4321/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

