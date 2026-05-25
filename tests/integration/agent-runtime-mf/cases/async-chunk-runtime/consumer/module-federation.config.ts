import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'asyncChunkRuntimeConsumer',
  remotes: {
    asyncChunkRuntimeProvider:
      'asyncChunkRuntimeProvider@http://localhost:4331/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

