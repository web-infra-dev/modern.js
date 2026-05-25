import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'reactMultiVersionConsumer',
  remotes: {
    reactMultiVersionProvider:
      'reactMultiVersionProvider@http://localhost:4311/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

