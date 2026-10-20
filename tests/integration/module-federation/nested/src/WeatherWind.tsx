import {
  getInstance,
  loadRemote,
} from '@module-federation/modern-js-v3/runtime';
import './DynamicRelay';
const Wind = getInstance()!.createLazyComponent({
  loader: async () => {
    const module = await loadRemote<{ default: () => React.JSX.Element }>(
      'dynamic/WeatherWind',
    );
    if (!module) throw new Error('Missing weather wind remote');
    return module;
  },
  loading: <p>正在加载风向…</p>,
  fallback: <p role="alert">风向加载失败</p>,
});
export default Wind;
