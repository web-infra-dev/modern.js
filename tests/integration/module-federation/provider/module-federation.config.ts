import { createModuleFederationConfig } from '@module-federation/enhanced';
import { shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_provider',
  dts: false,
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  exposes: {
    './WeatherApp': './src/exports/WeatherApp.tsx',
    './ProductApp': './src/exports/ProductApp.tsx',
    './OrdersApp': './src/exports/OrdersApp.tsx',
    './BridgeCard': './src/components/BridgeCard.tsx',
    './WeatherRelease': './src/WeatherRelease.tsx',
    './Weather': './src/components/Weather.tsx',
    './WeatherData': './src/components/WeatherData.tsx',
    './WeatherDays': './src/components/WeatherDays.tsx',
    './Forecast': './src/components/Forecast.tsx',
    './ClientRecovery': './src/components/ClientRecovery.tsx',
    './ServerRecovery': './src/components/ServerRecovery.tsx',
  },
  shared,
});
