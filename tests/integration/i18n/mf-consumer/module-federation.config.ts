import { createModuleFederationConfig } from '@module-federation/modern-js';

export default createModuleFederationConfig({
  name: 'consumer',
  remotes: {
    componentRemote:
      'i18nComponentProvider@http://localhost:3006/mf-manifest.json',
    AppRemote: 'i18nAppProvider@http://localhost:3005/mf-manifest.json',
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
