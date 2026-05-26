import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'asyncChunkRuntimeConsumer',
  remotes: {
    asyncChunkRuntimeProvider:
      'asyncChunkRuntimeProvider@http://localhost:4331/remote/mf-manifest.json',
  },
  shared: {
    react: { singleton: true, requiredVersion: dependencies.react },
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
  },
});
