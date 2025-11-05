import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

export default createModuleFederationConfig({
  name: 'rsc_ssr_remote',
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
    // Use server-safe wrappers to avoid evaluating client modules on Node.
    './Counter': './src/mf-exposes/Counter.ts',
    './DynamicMessage': './src/mf-exposes/DynamicMessage.ts',
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
