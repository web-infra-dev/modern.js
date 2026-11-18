import Weather from 'provider/Weather';
import { createReactRemote } from '@modern-js/runtime/mf';

const RemoteWeather = createReactRemote<{ local: boolean }>({
  remote: () => Weather,
  loading: <p role="status">Loading weather…</p>,
  fallback: ({ error }) => <p role="alert">{error.message}</p>,
});
import '../weather-base.css';
import '../../../provider/src/weather-scene.css';
import '../weather.css';

/** The existing /weather document, configured as a compiled static consumer. */
export default function StaticWeatherPage() {
  return (
    <main className="weather-scene">
      <RemoteWeather local />
    </main>
  );
}
