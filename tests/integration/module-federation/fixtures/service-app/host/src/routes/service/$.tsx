import { useState } from 'react';
import { useLocation } from '@modern-js/runtime/router';
import {
  createModernReactRemote,
  createReactRemote,
  ReactRemote,
} from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import WeatherApp from 'provider/ServiceWeatherApplication';
import './service.css';

const load = () => loadRemote('provider/ServiceWeatherApplication');
const preloaded = () => WeatherApp;
const options = {
  loading: <p role="status">Connecting to the weather service…</p>,
  fallback: ({ error }: { error: Error }) => (
    <p role="alert">{error.message}</p>
  ),
};
const Control = createReactRemote({
  remote: () => loadRemote('provider/Weather'),
  ...options,
});
const Weather = createModernReactRemote<{ label: string }>({
  remote: load,
  ...options,
});
const LocalWeather = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/WeatherApplication'),
  ...options,
});
const NoSSRWeather = createModernReactRemote<{ label: string }>({
  remote: load,
  noSSR: true,
  ...options,
});
const StaticWeather = createReactRemote({
  remote: preloaded,
  basename: '/service',
  ...options,
});
export default function ServiceWeather() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const [multiple] = useState(params.has('multi'));
  const [mounted, setMounted] = useState(!params.has('late'));
  const [label, setLabel] = useState('Hangzhou');
  const Remote = params.has('control')
    ? Control
    : params.has('local')
      ? LocalWeather
      : params.has('nossr')
        ? NoSSRWeather
        : params.has('static')
          ? StaticWeather
          : Weather;
  return (
    <main className="service-demo">
      <header className="service-demo-header">
        <div className="service-demo-heading">
          <p>Weather Lab</p>
          <h1>Weather Service</h1>
          <span>
            {params.has('late') ? 'Mount after page load' : 'Live forecast'}
          </span>
        </div>
        <div
          className="service-demo-controls"
          role="group"
          aria-label="Weather application controls"
        >
          <button
            type="button"
            className="service-demo-button service-demo-connection"
            data-testid="service-toggle"
            onClick={() => setMounted(value => !value)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v9m-5-6.5a8 8 0 1 0 10 0" />
            </svg>
            {mounted ? 'Disconnect' : 'Connect'}
          </button>
          <button
            type="button"
            className="service-demo-button service-demo-station"
            data-testid="service-props"
            onClick={() =>
              setLabel(value =>
                value === 'Hangzhou' ? 'West Lake' : 'Hangzhou',
              )
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m16 3 4 4-4 4M4 7h16M8 21l-4-4 4-4m12 4H4" />
            </svg>
            Change station
          </button>
          <input
            className="service-demo-note"
            aria-label="Host note"
            placeholder="Add a note…"
            defaultValue=""
          />
        </div>
      </header>
      {mounted &&
        (params.has('declarative') ? (
          <ReactRemote
            noSSR={params.has('nossr')}
            remote={params.has('static') ? preloaded : load}
            props={{ label }}
            basename="/service"
            memoryRoute={
              params.has('memory')
                ? {
                    entryPath: `/forecast/wed?probe=${params.get('probe') || 'memory'}`,
                  }
                : undefined
            }
            {...options}
          />
        ) : (
          <Remote label={label} />
        ))}
      {mounted && multiple && <Weather label="Second station" />}
    </main>
  );
}
