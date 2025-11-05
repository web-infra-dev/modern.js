import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

export default createModuleFederationConfig({
  name: 'rsc_csr_remote',
  manifest: {
    filePath: 'static',
    additionalData: manifest => {
      const base = assetPrefix ? assetPrefix.replace(/\/$/, '') : '';
      const remoteEntryUrl = `${base}/static/remoteEntry.js`;
      if (manifest.metaData?.remoteEntry) {
        manifest.metaData.remoteEntry.path = `${base}/static/`;
        manifest.metaData.remoteEntry.url = remoteEntryUrl;
      }
      return {
        remoteEntry: remoteEntryUrl,
      };
    },
  },
  filename: 'static/remoteEntry.js',
  shareScope: 'default',
  exposes: {
    './CounterClient': './src/mf-exposes/CounterClient.js',
    './DynamicMessageClient': './src/mf-exposes/DynamicMessageClient.js',
    './SuspendedClient': './src/mf-exposes/SuspendedClient.js',
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
