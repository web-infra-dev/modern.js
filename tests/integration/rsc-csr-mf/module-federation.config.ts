import { createModuleFederationConfig } from '@module-federation/modern-js';

export default createModuleFederationConfig({
  name: 'rsc_csr_remote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',

  // Only expose CLIENT-safe modules (NO ?layer=react-server)
  // Server components with layers don't exist in client compilation
  exposes: {
    './CounterClient': './src/components/Counter.tsx',
    './DynamicMessageClient': './src/components/DynamicMessage.tsx',
    './SuspendedClient': './src/components/Suspended.tsx',
  },

  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19',
    },
    'react/jsx-runtime': {
      singleton: true,
      requiredVersion: '^19',
    },
    'react/jsx-dev-runtime': {
      singleton: true,
      requiredVersion: '^19',
    },
    'server-only': {
      singleton: true,
    },
    'client-only': {
      singleton: true,
    },
  },
});
