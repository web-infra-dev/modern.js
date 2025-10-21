import { createModuleFederationConfig } from '@module-federation/modern-js-rsc';

const remoteBaseUrl =
  process.env.REMOTE_URL ?? 'http://localhost:3001';

export default createModuleFederationConfig({
  name: 'rsc_csr_host',

  // Configure remote pointing to rsc-csr-mf app
  remotes: {
    rsc_csr_remote: `rsc_csr_remote@${remoteBaseUrl}/static/mf-manifest.json`,
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
