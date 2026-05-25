import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'redirectLoaderConsumer',
  remotes: {
    redirectLoaderProvider:
      'redirectLoaderProvider@http://localhost:4351/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

