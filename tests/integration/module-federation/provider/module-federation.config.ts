import { createModuleFederationConfig } from '@module-federation/enhanced';
import { origin, shared } from '../ports';
export default createModuleFederationConfig({
  name: 'lab_provider',
  dts: false,
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  ...(process.env.MF_LAB_UPDATES === 'all' || process.env.MF_LAB_SERVICE_NESTED
    ? {
        remotes: {
          nested: `lab_nested@${origin('nested', 4304)}/static/mf-manifest.json`,
          library: `lab_library@${origin('library', 4305)}/mf-manifest.json`,
        },
      }
    : {}),
  exposes: {
    ...(process.env.MF_LAB_SERVICE
      ? {
          './ServiceWeatherApplication':
            './src/exports/ServiceWeatherApplication.tsx',
        }
      : {}),
    './WeatherApplication': './src/exports/WeatherApplication.tsx',
    './CurrentWeatherApp': './src/exports/CurrentWeatherApp.tsx',
    './WeatherForecastApp': './src/exports/WeatherForecastApp.tsx',
    './AirQualityApp': './src/exports/AirQualityApp.tsx',
    './WeatherApp': './src/exports/WeatherApp.tsx',
    './ProductApp': './src/exports/ProductApp.tsx',
    './FailedSSRApp': './src/exports/FailedSSRApp.tsx',
    './RetryProductApp': './src/exports/RetryProductApp.tsx',
    './OrdersApp': './src/exports/OrdersApp.tsx',
    './BridgeCard': './src/components/BridgeCard.tsx',
    './InputCard': './src/components/InputCard.tsx',
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
