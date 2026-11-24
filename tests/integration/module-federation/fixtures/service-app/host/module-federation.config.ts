import { createModuleFederationConfig } from '@module-federation/enhanced';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: `service_${process.env.MF_LAB_HOST_MODE}`,
  dts: false,
  runtimePlugins: [
    [
      require.resolve('./src/node-entry-probe.ts'),
      {
        block: Boolean(process.env.MF_SERVICE_BLOCK_NODE),
      },
    ],
  ],
  remotes: {
    provider: `lab_provider@${origin('provider', 0)}/static/mf-manifest.json`,
  },
  shared,
});
