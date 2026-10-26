import './DynamicRelay';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { labComponent } from '../../host/src/failure/components';
export default labComponent(
  {
    loader: async () => {
      const module = await loadRemote<{ default: () => React.JSX.Element }>(
        'dynamic/WeatherWind',
      );
      if (!module) throw new Error('Missing weather wind remote');
      return module;
    },
    loading: <p>Loading wind…</p>,
  },
  'dynamic/WeatherWind',
  'dynamicNested/WeatherWind',
  true,
);
