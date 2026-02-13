import path from 'path';
import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

const LAYERS = {
  ssr: 'server-side-rendering',
  rsc: 'react-server-components',
} as const;

const reactServerPath = path.join(
  path.dirname(require.resolve('react/package.json')),
  'react.react-server.js',
);

const layeredShared = [
  {
    react: {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
    },
  },
  {
    react: {
      import: 'react',
      shareKey: 'react',
      singleton: true,
      requiredVersion: false,
      shareScope: 'ssr',
      layer: LAYERS.ssr,
      issuerLayer: LAYERS.ssr,
    },
    'react-dom': {
      import: 'react-dom',
      shareKey: 'react-dom',
      singleton: true,
      requiredVersion: false,
      shareScope: 'ssr',
      layer: LAYERS.ssr,
      issuerLayer: LAYERS.ssr,
    },
  },
  {
    react: {
      import: reactServerPath,
      shareKey: 'react',
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
    },
    'react-dom': {
      import: 'react-dom',
      shareKey: 'react-dom',
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
    },
  },
] as const;

export default createModuleFederationConfig({
  name: 'rscRemote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  exposes: {
    './RemoteClientCounter': {
      import: './src/components/RemoteClientCounter.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteClientBadge': {
      import: './src/components/RemoteClientBadge.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteServerCard': {
      import: './src/components/RemoteServerCard.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteServerDefault': {
      import: './src/components/RemoteServerDefault.tsx',
      layer: LAYERS.rsc,
    } as any,
    './AsyncRemoteServerInfo': {
      import: './src/components/AsyncRemoteServerInfo.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteNestedMixed': {
      import: './src/components/RemoteNestedMixed.tsx',
      layer: LAYERS.rsc,
    } as any,
    './remoteServerOnly': {
      import: './src/components/serverOnly.ts',
      layer: LAYERS.rsc,
    } as any,
    './remoteServerOnlyDefault': {
      import: './src/components/serverOnlyDefault.ts',
      layer: LAYERS.rsc,
    } as any,
    './remoteMeta': {
      import: './src/components/remoteMeta.ts',
      layer: LAYERS.rsc,
    } as any,
    './actions': {
      import: './src/components/actions.ts',
      layer: LAYERS.rsc,
    } as any,
    './nestedActions': {
      import: './src/components/nestedActions.ts',
      layer: LAYERS.rsc,
    } as any,
    './defaultAction': {
      import: './src/components/defaultAction.ts',
      layer: LAYERS.rsc,
    } as any,
  },
  shared: layeredShared as any,
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
