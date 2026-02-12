import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'rscRemote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  exposes: {
    './RemoteClientCounter': './src/components/RemoteClientCounter.tsx',
    './RemoteServerCard': './src/components/RemoteServerCard.tsx',
    './RemoteNestedMixed': './src/components/RemoteNestedMixed.tsx',
    './remoteServerOnly': './src/components/serverOnly.ts',
    './actions': './src/components/actions.ts',
    './nestedActions': './src/components/nestedActions.ts',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
