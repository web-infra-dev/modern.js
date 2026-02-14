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
const CALLBACK_BOOTSTRAP_IMPORT = './src/runtime/initServerCallback.ts';
const createRscExpose = (importPath: string) =>
  ({
    import: [CALLBACK_BOOTSTRAP_IMPORT, importPath],
    layer: LAYERS.rsc,
  }) as any;
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
const invalidExposeKeys = Object.keys(remoteExposeImports).filter(
  exposeKey => !exposeKey.startsWith('./'),
);
if (invalidExposeKeys.length > 0) {
  throw new Error(
    `Remote expose keys must be module-federation paths starting with "./". Invalid keys: ${invalidExposeKeys.join(', ')}`,
  );
}
const COMPONENT_EXPOSE_PREFIX = './src/components/';
const nonComponentExposeEntries = Object.entries(remoteExposeImports).filter(
  ([, importPath]) => !importPath.startsWith(COMPONENT_EXPOSE_PREFIX),
);
if (nonComponentExposeEntries.length > 0) {
  throw new Error(
    `Remote exposes must point to component userland modules (${COMPONENT_EXPOSE_PREFIX}). Invalid entries: ${nonComponentExposeEntries
      .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
      .join(', ')}`,
  );
}
const nonTypeScriptExposeEntries = Object.entries(remoteExposeImports).filter(
  ([, importPath]) => !/\.[tj]sx?$/.test(importPath),
);
if (nonTypeScriptExposeEntries.length > 0) {
  throw new Error(
    `Remote expose imports must use explicit TypeScript entry extensions for deterministic resolution. Invalid entries: ${nonTypeScriptExposeEntries
      .map(([exposeKey, importPath]) => `${exposeKey} -> ${importPath}`)
      .join(', ')}`,
  );
}
const callbackExposeEntries = Object.entries(remoteExposeImports).filter(
  ([, importPath]) => importPath === CALLBACK_BOOTSTRAP_IMPORT,
);
if (callbackExposeEntries.length > 0) {
  throw new Error(
    `Callback bootstrap module (${CALLBACK_BOOTSTRAP_IMPORT}) must remain internal-only and cannot be exposed. Invalid entries: ${callbackExposeEntries
      .map(([exposeKey]) => exposeKey)
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
