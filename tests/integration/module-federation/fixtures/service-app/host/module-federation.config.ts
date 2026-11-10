import { createModuleFederationConfig } from '@module-federation/enhanced';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: `service_${process.env.MF_LAB_HOST_MODE}`,
  dts: false,
  runtimePlugins: process.env.MF_SERVICE_BLOCK_NODE
    ? [require.resolve('./src/block-node.ts')]
    : [],
  remotes: {
    provider: `lab_provider@${origin('provider', 0)}/static/mf-manifest.json`,
  },
  shared,
});
