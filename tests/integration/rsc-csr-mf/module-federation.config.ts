import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

export default createModuleFederationConfig({
  name: 'rsc_csr_remote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  shareScope: 'default',
  exposes: {
    './CounterClient': './src/components/Counter.tsx',
    './DynamicMessageClient': './src/components/DynamicMessage.tsx',
    './SuspendedClient': './src/components/Suspended.tsx',
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
    },
    'react/jsx-runtime': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
    },
    'react/jsx-dev-runtime': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
    },
    'server-only': {
      singleton: true,
      shareScope: 'default',
    },
    'client-only': {
      singleton: true,
      shareScope: 'default',
    },
  },
});
