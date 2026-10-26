import { createModuleFederationConfig } from '@module-federation/enhanced';
import { shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_provider',
  dts: false,
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  exposes: {
    './Weather': './src/components/Weather.tsx',
    './WeatherData': './src/components/WeatherData.tsx',
    './WeatherDays': './src/components/WeatherDays.tsx',
    './Signal': './src/components/Signal.tsx',
    './Forecast': './src/components/Forecast.tsx',
    './ClientRecovery': './src/components/ClientRecovery.tsx',
    './ServerRecovery': './src/components/ServerRecovery.tsx',
  },
  shared,
});
