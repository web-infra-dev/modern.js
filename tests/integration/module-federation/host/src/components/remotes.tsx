import { labComponent } from '../failure/components';
import {
  getInstance,
  registerRemotes,
} from '@module-federation/enhanced/runtime';
import { lazyLoadComponentPlugin } from '@module-federation/bridge-react';

// The existing explicit data-prefetch API is supplied by the runtime plugin.
// Component rendering itself always goes through the unified framework API.
getInstance()!.registerPlugins([lazyLoadComponentPlugin()]);
registerRemotes([
  {
    name: 'lab_library',
    alias: 'dynamic',
    entry: `${process.env.MF_LAB_LIBRARY}/mf-manifest.json`,
  },
]);
const loading = (
  <p className="loading" role="status">
    Connecting to the weather station…
  </p>
);
export const Forecast = labComponent({ loading }, 'provider/Forecast');
export const ModernRelease = labComponent(
  { loading },
  'provider/WeatherRelease',
);
export const DynamicRelease = labComponent(
  { loading },
  'dynamic/WeatherRelease',
);
export const ClientForecast = labComponent(
  { loading, noSSR: true },
  'dynamic/Forecast',
);
export const ClientRecovery = labComponent(
  { loading },
  'provider/ClientRecovery',
);
export const ServerRecovery = labComponent(
  { loading },
  'provider/ServerRecovery',
);
export const NoData = labComponent({ loading, noSSR: true }, 'dynamic/NoData');
export const Reload = labComponent({ loading, noSSR: true }, 'dynamic/Reload');
