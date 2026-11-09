import { useEffect, useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { createReactRemote, ReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import AirQuality from 'provider/AirQualityApp';
import { LabNav } from '../../components/Comparison';
import './weather-board.css';

const memoryRoute = { entryPath: '/' };
const sources = [
  {
    name: 'string',
    id: 'CurrentWeatherApp',
    remote: 'provider/CurrentWeatherApp',
  },
  {
    name: 'loader',
    id: 'WeatherForecastApp',
    remote: () =>
      loadRemote<typeof import('provider/WeatherForecastApp')>(
        'provider/WeatherForecastApp',
      ),
  },
  { name: 'preloaded', id: 'AirQualityApp', remote: () => AirQuality },
] as const;
const forms = sources.map(source => ({
  ...source,
  Factory: createReactRemote<{ label: string }>({
    remote: source.remote,
    memoryRoute,
  }),
}));
const ClientOnly = createReactRemote({
  remote: () => {
    if (typeof window === 'undefined')
      throw new Error('BRIDGE_NO_SSR_LOADER_CALLED');
    return AirQuality;
  },
  noSSR: true,
  memoryRoute,
  loading: (
    <p data-testid="bridge-client-placeholder">
      Your travel air report will appear when the page is ready.
    </p>
  ),
});

export default function BridgeSSR() {
  const [params] = useSearchParams();
  const api = params.get('api') === 'declarative' ? 'declarative' : 'factory';
  const [label, setLabel] = useState('Hangzhou');
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    document.documentElement.dataset.bridgeHostReady = 'true';
    return () => {
      delete document.documentElement.dataset.bridgeHostReady;
    };
  }, []);
  return (
    <div className="weather-board">
      <LabNav />
      <main className="weather-board-main">
        <header className="weather-board-heading">
          <div>
            <p className="weather-board-kicker">
              THE DAILY OUTLOOK / 30.18° N, 120.15° E
            </p>
            <h1>Look up. Slow down.</h1>
            <p>Your day in Hangzhou, at a glance.</p>
          </div>
          <div className="weather-board-date">
            <strong>Monday, 9 November</strong>
            <span>2026 · Autumn by the lake</span>
          </div>
        </header>
        <div className="weather-board-toolbar">
          <span>
            <i aria-hidden="true" /> Weather bulletin · 10:30 CST
          </span>
          <button
            data-testid="bridge-rename"
            onClick={() =>
              setLabel(value =>
                value === 'Hangzhou' ? 'Hangzhou · West Lake' : 'Hangzhou',
              )
            }
          >
            {label === 'Hangzhou' ? 'Follow West Lake' : 'Follow city centre'} ↗
          </button>
        </div>
        <div className="weather-board-grid">
          {forms.map(({ name, remote, Factory }) => (
            <div
              className={`weather-board-card weather-board-${name}`}
              key={name}
              data-testid={`bridge-input-${name}`}
            >
              {mounted &&
                (api === 'factory' ? (
                  <Factory label={label} />
                ) : (
                  <ReactRemote
                    remote={remote}
                    memoryRoute={memoryRoute}
                    props={{ label }}
                  />
                ))}
            </div>
          ))}
        </div>
        <aside className="weather-board-note">
          <span aria-hidden="true">↗</span>
          <div>
            <strong>Make time for the long way home.</strong>
            <p>
              Clear skies until evening. Sunset is at 17:08 — bring a light
              layer.
            </p>
          </div>
          <span className="weather-board-season">AUTUMN / 杭州</span>
        </aside>
        <details className="weather-board-info">
          <summary>
            Behind this forecast{' '}
            <span>Bridge SSR demo &amp; travel report</span>
          </summary>
          <p>
            Three Modern applications render on the server and hydrate in place.
            This local bulletin uses fixed sample data, not a live weather feed.
          </p>
          <nav aria-label="Bridge consumer API">
            <a
              href="/bridge-ssr"
              aria-current={api === 'factory' ? 'page' : undefined}
            >
              createReactRemote
            </a>
            <a
              href="/bridge-ssr?api=declarative"
              aria-current={api === 'declarative' ? 'page' : undefined}
            >
              ReactRemote
            </a>
          </nav>
          <ul>
            {forms.map(({ name, id }) => (
              <li key={name}>
                <code>{name}</code> → provider/{id}
              </li>
            ))}
          </ul>
          <p>
            Each input consumes a distinct export. The container, shared chunks
            and Module Federation caches can still be shared. Switching API here
            does not reset server caches.
          </p>
          <button
            data-testid="bridge-toggle"
            onClick={() => setMounted(value => !value)}
          >
            {mounted ? 'Disconnect' : 'Reconnect'} weather panels
          </button>
          <section
            className="weather-board-travel"
            data-testid="bridge-client-only"
          >
            <h2>
              Your travel report <small>Client only · noSSR</small>
            </h2>
            <ClientOnly label="Travel air quality" />
          </section>
        </details>
        <footer className="weather-board-footer">
          <span>WEATHER LAB</span>
          <span>A calmer view of the day.</span>
          <span>Modern.js · Module Federation</span>
        </footer>
      </main>
    </div>
  );
}
