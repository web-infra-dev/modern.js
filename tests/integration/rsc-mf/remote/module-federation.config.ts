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
const createRscExpose = (importPath: string) =>
  ({
    import: importPath,
    layer: LAYERS.rsc,
  }) as any;
const RUNTIME_EXPOSE_PREFIX = './src/runtime/exposes/';
const remoteExposeImports: Record<string, string> = {
  './RemoteClientCounter': './src/runtime/exposes/RemoteClientCounter.tsx',
  './RemoteClientBadge': './src/runtime/exposes/RemoteClientBadge.tsx',
  './RemoteServerCard': './src/runtime/exposes/RemoteServerCard.tsx',
  './RemoteServerDefault': './src/runtime/exposes/RemoteServerDefault.tsx',
  './AsyncRemoteServerInfo': './src/runtime/exposes/AsyncRemoteServerInfo.tsx',
  './remoteServerOnly': './src/runtime/exposes/remoteServerOnly.ts',
  './remoteServerOnlyDefault':
    './src/runtime/exposes/remoteServerOnlyDefault.ts',
  './remoteMeta': './src/runtime/exposes/remoteMeta.ts',
  './actions': './src/runtime/exposes/actions.ts',
  './nestedActions': './src/runtime/exposes/nestedActions.ts',
  './defaultAction': './src/runtime/exposes/defaultAction.ts',
  './actionBundle': './src/runtime/exposes/actionBundle.ts',
  './infoBundle': './src/runtime/exposes/infoBundle.ts',
};
const nonRuntimeExposeEntries = Object.entries(remoteExposeImports).filter(
  ([, importPath]) => !importPath.startsWith(RUNTIME_EXPOSE_PREFIX),
);
if (nonRuntimeExposeEntries.length > 0) {
  throw new Error(
    `All remote exposes must point to runtime wrappers (${RUNTIME_EXPOSE_PREFIX}). Invalid entries: ${nonRuntimeExposeEntries
      .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
      .join(', ')}`,
  );
}

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
  exposes: Object.fromEntries(
    Object.entries(remoteExposeImports).map(([exposeKey, importPath]) => [
      exposeKey,
      createRscExpose(importPath),
    ]),
  ) as any,
  shared: sharedByScope as any,
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
