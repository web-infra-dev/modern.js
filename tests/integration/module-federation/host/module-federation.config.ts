import { createModuleFederationConfig } from '@module-federation/enhanced';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_host',
  dts: false,
  runtimePlugins: [
    require.resolve('./src/plugins/inspect.tsx'),
    require.resolve('./src/plugins/recovery.ts'),
  ],
  remotes: {
    provider: `lab_provider@${origin('provider', 4301)}/static/mf-manifest.json`,
    nested: `lab_nested@${origin('nested', 4302)}/static/mf-manifest.json`,
  },
  shared,
});
