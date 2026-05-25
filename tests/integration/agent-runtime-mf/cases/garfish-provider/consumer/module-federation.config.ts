import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'garfishProviderConsumer',
  remotes: {
    garfishProvider: 'garfishProvider@http://localhost:4341/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

