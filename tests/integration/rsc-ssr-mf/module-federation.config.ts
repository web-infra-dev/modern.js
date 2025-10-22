import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

export default createModuleFederationConfig({
  name: 'rsc_ssr_remote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  shareScope: 'default',
  exposes: {
    './Counter': './src/server-component-root/components/Counter.tsx',
    './DynamicMessage':
      './src/server-component-root/components/DynamicMessageExport.tsx',
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
