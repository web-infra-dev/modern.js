import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_host',
  dts: false,
  remotes: {
    provider: `lab_provider@${origin('provider', 4301)}/static/mf-manifest.json`,
    nested: `lab_nested@${origin('nested', 4302)}/static/mf-manifest.json`,
    library: `lab_library@${origin('library', 4303)}/mf-manifest.json`,
  },
  shared,
});
