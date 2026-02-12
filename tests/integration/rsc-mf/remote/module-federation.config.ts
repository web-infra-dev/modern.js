import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'rscRemote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  exposes: {
    './RemoteClientCounter': './src/components/RemoteClientCounter.tsx',
    './RemoteClientBadge': './src/components/RemoteClientBadge.tsx',
    './RemoteServerCard': './src/components/RemoteServerCard.tsx',
    './RemoteServerDefault': './src/components/RemoteServerDefault.tsx',
    './AsyncRemoteServerInfo': './src/components/AsyncRemoteServerInfo.tsx',
    './RemoteNestedMixed': './src/components/RemoteNestedMixed.tsx',
    './remoteServerOnly': './src/components/serverOnly.ts',
    './remoteServerOnlyDefault': './src/components/serverOnlyDefault.ts',
    './remoteMeta': './src/components/remoteMeta.ts',
    './actions': './src/components/actions.ts',
    './nestedActions': './src/components/nestedActions.ts',
    './defaultAction': './src/components/defaultAction.ts',
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
