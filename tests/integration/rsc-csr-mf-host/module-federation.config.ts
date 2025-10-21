import { createModuleFederationConfig } from '@module-federation/modern-js';

const remoteBaseUrl =
  process.env.REMOTE_URL ?? 'http://localhost:3001';

export default createModuleFederationConfig({
  name: 'rsc_csr_host',

  // Configure remote pointing to rsc-csr-mf app
  remotes: {
    rsc_csr_remote: `rsc_csr_remote@${remoteBaseUrl}/static/mf-manifest.json`,
  },

  // Share same dependencies as remote (must match exactly)
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19',
    },
    'react/jsx-runtime': {
      singleton: true,
      requiredVersion: '^19',
    },
    'react/jsx-dev-runtime': {
      singleton: true,
      requiredVersion: '^19',
    },
    'server-only': {
      singleton: true,
    },
    'client-only': {
      singleton: true,
    },
  },
});
