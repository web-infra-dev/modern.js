import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_provider',
  dts: false,
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  exposes: {
    './Signal': './src/components/Signal.tsx',
    './Forecast': './src/components/Forecast.tsx',
    './ClientRecovery': './src/components/ClientRecovery.tsx',
    './ServerRecovery': './src/components/ServerRecovery.tsx',
  },
  shared,
});
