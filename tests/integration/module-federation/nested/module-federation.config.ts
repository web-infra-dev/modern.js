import { createModuleFederationConfig } from '@module-federation/enhanced';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_nested',
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  dts: false,
  runtimePlugins: [
    require.resolve('../host/src/plugins/inspect.tsx'),
    require.resolve('../host/src/plugins/recovery.ts'),
  ],
  remotes: {
    provider: `lab_provider@${origin('provider', 4301)}/static/mf-manifest.json`,
  },
  exposes: {
    './WeatherDays': './src/WeatherDays.tsx',
    './WeatherWind': './src/WeatherWind.tsx',
  },
  shared,
});
