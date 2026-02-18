import fs from 'fs';
import path from 'path';
import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

const REMOTE_PORT = process.env.RSC_MF_REMOTE_PORT || '3008';
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

const readPackageVersion = (pkg: string) =>
  JSON.parse(fs.readFileSync(require.resolve(`${pkg}/package.json`), 'utf8')).version;
const reactVersion = readPackageVersion('react');
const reactDomVersion = readPackageVersion('react-dom');
const reactServerDomVersion = readPackageVersion('react-server-dom-rspack');

const sharedByScope = [
  {
    react: {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
      version: reactVersion,
    },
    'react-dom': {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
      version: reactDomVersion,
    },
    'react-server-dom-rspack': {
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
      version: reactServerDomVersion,
    },
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
      singleton: true,
      requiredVersion: false,
      shareScope: 'default',
      version: reactServerDomVersion,
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
      version: reactVersion,
    },
    'react-dom': {
      import: 'react-dom',
      shareKey: 'react-dom',
      singleton: true,
      requiredVersion: false,
      shareScope: 'ssr',
      layer: LAYERS.ssr,
      issuerLayer: LAYERS.ssr,
      version: reactDomVersion,
    },
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
      singleton: true,
      requiredVersion: false,
      shareScope: 'ssr',
      layer: LAYERS.ssr,
      issuerLayer: LAYERS.ssr,
      version: reactServerDomVersion,
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
      version: reactVersion,
    },
    'react-dom': {
      import: reactDomServerImport,
      shareKey: 'react-dom',
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
      version: reactDomVersion,
    },
    'react-server-dom-rspack/client.browser': {
      import: reactServerDomClientImport,
      shareKey: reactServerDomClientImport,
      singleton: true,
      requiredVersion: false,
      shareScope: 'rsc',
      layer: LAYERS.rsc,
      issuerLayer: LAYERS.rsc,
      version: reactServerDomVersion,
    },
  },
];

export default createModuleFederationConfig({
  name: 'rscHost',
  remotes: {
    rscRemote: `rscRemote@http://127.0.0.1:${REMOTE_PORT}/static/mf-manifest.json`,
  },
  shared: sharedByScope as any,
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
