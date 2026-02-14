import path from 'path';
import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { createRscExposeDefinitions } from './src/runtime/createRscExposeDefinitions';

const LAYERS = {
  ssr: 'server-side-rendering',
  rsc: 'react-server-components',
} as const;
const reactServerImport = path.join(
  path.dirname(require.resolve('react/package.json')),
  'react.react-server.js',
);
const reactDomServerImport = path.join(
  path.dirname(require.resolve('react-dom/package.json')),
  'react-dom.react-server.js',
);
const reactServerDomClientImport = 'react-server-dom-rspack/client.browser';
const remoteExposeImports: Record<string, string> = {
  './RemoteClientCounter': './src/components/RemoteClientCounter.tsx',
  './RemoteClientBadge': './src/components/RemoteClientBadge.tsx',
  './RemoteServerCard': './src/components/RemoteServerCard.tsx',
  './RemoteServerDefault': './src/components/RemoteServerDefault.tsx',
  './AsyncRemoteServerInfo': './src/components/AsyncRemoteServerInfo.tsx',
  './remoteServerOnly': './src/components/serverOnly.ts',
  './remoteServerOnlyDefault': './src/components/serverOnlyDefault.ts',
  './remoteMeta': './src/components/remoteMeta.ts',
  './actions': './src/components/actions.ts',
  './nestedActions': './src/components/nestedActions.ts',
  './defaultAction': './src/components/defaultAction.ts',
  './actionBundle': './src/components/actionBundle.ts',
  './infoBundle': './src/components/infoBundle.ts',
};

const sharedByScope = [
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
    'react-server-dom-rspack': {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
    },
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
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
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
      singleton: true,
      requiredVersion: false,
      shareScope: 'ssr',
      layer: LAYERS.ssr,
      issuerLayer: LAYERS.ssr,
    },
  },
  {
    react: {
      import: reactServerImport,
      shareKey: 'react',
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
    },
    'react-dom': {
      import: reactDomServerImport,
      shareKey: 'react-dom',
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
    },
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
    },
  },
];

export default createModuleFederationConfig({
  name: 'rscRemote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  exposes: createRscExposeDefinitions(remoteExposeImports) as any,
  shared: sharedByScope as any,
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
