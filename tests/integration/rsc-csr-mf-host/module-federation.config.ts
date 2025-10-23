import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

const remoteBaseUrl = process.env.REMOTE_URL ?? 'http://localhost:3001';
const remoteManifestUrl = `${remoteBaseUrl}/static/mf-manifest.json`;

export default createModuleFederationConfig({
  name: 'rsc_csr_host',

  // Configure remote pointing to rsc-csr-mf app
  remotes: {
    rsc_csr_remote: `rsc_csr_remote@${remoteManifestUrl}`,
  },

  // Explicit shareScope for RSC module sharing
  shareScope: 'default',

  // Share same dependencies as remote (must match exactly)
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
      eager: true,
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
      eager: true,
    },
    'react/jsx-runtime': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
      eager: true,
    },
    'react/jsx-dev-runtime': {
      singleton: true,
      requiredVersion: '^19',
      shareScope: 'default',
      strictVersion: false,
      eager: true,
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
