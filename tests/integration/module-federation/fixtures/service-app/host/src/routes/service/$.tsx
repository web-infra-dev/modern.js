import { useState } from 'react';
import { useLocation } from '@modern-js/runtime/router';
import {
  createModernReactRemote,
  createReactRemote,
  ReactRemote,
} from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import WeatherApp from 'provider/ServiceWeatherApplication';

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
    <main>
      <h1>
        Weather Service ·{' '}
        {params.has('late') ? 'Mount after page load' : 'Live forecast'}
      </h1>
      <button
        data-testid="service-toggle"
        onClick={() => setMounted(value => !value)}
      >
        {mounted ? 'Disconnect' : 'Connect'}
      </button>
      <button
        data-testid="service-props"
        onClick={() =>
          setLabel(value => (value === 'Hangzhou' ? 'West Lake' : 'Hangzhou'))
        }
      >
        Change station
      </button>
      <input aria-label="Host note" defaultValue="" />
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
