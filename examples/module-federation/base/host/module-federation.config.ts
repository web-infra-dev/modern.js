import { createModuleFederationConfig } from '@module-federation/enhanced';

export default createModuleFederationConfig({
  name: 'host',
  dts: { consumeTypes: { typesOnBuild: true } },
  remotes: {
    remote: 'remote@http://localhost:3051/static/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});
