import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

const REMOTE_PORT = process.env.RSC_MF_REMOTE_PORT || '3008';

const LAYERS = {
  ssr: 'server-side-rendering',
  rsc: 'react-server-components',
};

const sharedByScope = () => [
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
      import: 'react',
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
];

export default createModuleFederationConfig({
  name: 'rscHost',
  remotes: {
    rscRemote: `rscRemote@http://127.0.0.1:${REMOTE_PORT}/static/mf-manifest.json`,
  },
  shared: sharedByScope(),
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
