import { createModuleFederationConfig } from '@module-federation/modern-js';

export default createModuleFederationConfig({
  name: 'consumer',
  remotes: {
    remote: 'provider@http://localhost:3006/mf-manifest.json',
    producerApp: 'provider@http://localhost:3005/mf-manifest.json',
  },
  bridge: {
    enableBridgeRouter: false,
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-i18next': { singleton: true },
    i18next: { singleton: true },
  },
});
