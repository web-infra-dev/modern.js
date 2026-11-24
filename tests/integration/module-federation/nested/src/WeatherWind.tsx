import './remotes';
import { labComponent } from '../../host/src/failure/components';
export default labComponent(
  { loading: <p>Loading weather…</p> },
  'dynamic/WeatherWind',
  'nested/WeatherWind',
  true,
);
