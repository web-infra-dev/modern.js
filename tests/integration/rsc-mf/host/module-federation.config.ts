import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

const REMOTE_PORT = process.env.RSC_MF_REMOTE_PORT || '3008';

export default createModuleFederationConfig({
  name: 'rscHost',
  remotes: {
    rscRemote: `rscRemote@http://127.0.0.1:${REMOTE_PORT}/static/mf-manifest.json`,
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
  dts: false,
  experiments: {
    asyncStartup: true,
    rsc: true,
  } as any,
});
