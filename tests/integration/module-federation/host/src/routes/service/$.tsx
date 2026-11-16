import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';

const WeatherService = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/ServiceWeatherApplication'),
  loading: <p role="status">Connecting to the weather service…</p>,
  fallback: ({ error }) => <p role="alert">{error.message}</p>,
});

export default function ServiceWeather() {
  return <WeatherService label="Hangzhou" />;
}
