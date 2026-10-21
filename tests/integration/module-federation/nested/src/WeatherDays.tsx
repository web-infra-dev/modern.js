import './DynamicRelay';
import { labComponent } from '../../host/src/failure/components';
export default labComponent(
  {
    loader: () => import('provider/WeatherDays'),
    loading: <p>Loading daily forecast…</p>,
  },
  'provider/WeatherDays',
  'nested/WeatherDays',
  true,
);
