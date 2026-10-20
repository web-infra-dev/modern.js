import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_nested',
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  dts: false,
  remotes: {
    provider: `lab_provider@${origin('provider', 4301)}/static/mf-manifest.json`,
  },
  exposes: {
    './Relay': './src/Relay.tsx',
    './DynamicRelay': './src/DynamicRelay.tsx',
  },
  shared,
});
