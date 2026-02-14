import path from 'path';
import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

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
  exposes: {
    './RemoteClientCounter': {
      import: './src/runtime/exposes/RemoteClientCounter.tsx',
      layer: LAYERS.rsc,
    } as any,
    './src/components/RemoteClientCounter.tsx': {
      import: './src/runtime/exposes/RemoteClientCounter.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteClientBadge': {
      import: './src/runtime/exposes/RemoteClientBadge.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteServerCard': {
      import: './src/runtime/exposes/RemoteServerCard.tsx',
      layer: LAYERS.rsc,
    } as any,
    './RemoteServerDefault': {
      import: './src/runtime/exposes/RemoteServerDefault.tsx',
      layer: LAYERS.rsc,
    } as any,
    './AsyncRemoteServerInfo': {
      import: './src/runtime/exposes/AsyncRemoteServerInfo.tsx',
      layer: LAYERS.rsc,
    } as any,
    './remoteServerOnly': {
      import: './src/runtime/exposes/remoteServerOnly.ts',
      layer: LAYERS.rsc,
    } as any,
    './remoteServerOnlyDefault': {
      import: './src/runtime/exposes/remoteServerOnlyDefault.ts',
      layer: LAYERS.rsc,
    } as any,
    './remoteMeta': {
      import: './src/runtime/exposes/remoteMeta.ts',
      layer: LAYERS.rsc,
    } as any,
    './actions': {
      import: './src/runtime/exposes/actions.ts',
      layer: LAYERS.rsc,
    } as any,
    './nestedActions': {
      import: './src/runtime/exposes/nestedActions.ts',
      layer: LAYERS.rsc,
    } as any,
    './defaultAction': {
      import: './src/runtime/exposes/defaultAction.ts',
      layer: LAYERS.rsc,
    } as any,
    './actionBundle': {
      import: './src/runtime/exposes/actionBundle.ts',
      layer: LAYERS.rsc,
    } as any,
    './infoBundle': {
      import: './src/runtime/exposes/infoBundle.ts',
      layer: LAYERS.rsc,
    } as any,
  },
  shared: sharedByScope as any,
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
