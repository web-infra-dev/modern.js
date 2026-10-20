import { useSearchParams } from '@modern-js/runtime/router';
import {
  getInstance,
  loadRemote,
} from '@module-federation/modern-js-v3/runtime';
import './remotes';
import type { WeatherData } from '../../../provider/src/weather-ui';
type Current = {
  default: (props: {
    local?: boolean;
    mfData?: WeatherData;
  }) => React.JSX.Element;
};
const runtime = getInstance()!;
// Start the actual MF loader while the route module initializes, before React
// renders its lazy component. SSR data is already provided in the HTML.
if (typeof window !== 'undefined') {
  const query = new URLSearchParams(window.location.search);
  if (
    query.get('data') === 'mf' &&
    query.get('render') === 'csr' &&
    query.get('prefetch') === '1'
  ) {
    performance.mark('weather-prefetch-start');
    window.parent.postMessage(
      {
        type: 'mf-weather',
        event: 'Data prefetch started',
        at: Math.round(performance.now()),
      },
      window.location.origin,
    );
    void runtime.prefetch({ id: 'provider/WeatherData' }).catch(() => {
      window.parent.postMessage(
        {
          type: 'mf-weather',
          event: 'Data request failed',
          at: Math.round(performance.now()),
        },
        window.location.origin,
      );
    });
  }
}

const options = {
  loading: <div className="weather-wait">Connecting to weather station…</div>,
  fallback: <p role="alert">Could not connect to weather station</p>,
};
async function remote<T>(name: string) {
  const module = await loadRemote<T>(name);
  if (!module) throw new Error(name);
  return module;
}
const Current = runtime.createLazyComponent({
  ...options,
  loader: () => remote<Current>('provider/Weather'),
});
const Data = runtime.createLazyComponent({
  ...options,
  loader: () => remote<Current>('provider/WeatherData'),
});
const ClientData = runtime.createLazyComponent({
  ...options,
  noSSR: true,
  loader: () => remote<Current>('provider/WeatherData'),
});
const Hourly = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('dynamic/WeatherHourly'),
});
const Days = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('nested/WeatherDays'),
});
const Wind = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('dynamicNested/WeatherWind'),
});
export default function WeatherPage() {
  const [params] = useSearchParams();
  const compact = params.get('compact') === '1';
  const local = params.get('data') === 'local';
  const sharedSky = params.get('sharedSky') === '1';
  return (
    <main
      className={`weather-scene ${compact ? 'compact' : ''} ${sharedSky ? 'shared-sky' : ''}`}
    >
      {!sharedSky && (
        <>
          <div className="sky-cloud cloud-one" />
          <div className="sky-cloud cloud-two" />
        </>
      )}
      <div className="weather-content">
        {params.get('data') === 'mf' ? (
          params.get('render') === 'csr' ? (
            <ClientData />
          ) : (
            <Data />
          )
        ) : (
          <Current local={local} />
        )}
        <div className="weather-grid">
          <Hourly />
          {!compact && (
            <>
              <Days />
              <Wind />
              <section className="weather-card air-weather">
                <h2>◌ Air quality</h2>
                <strong>49</strong>
                <p>Good</p>
                <div className="air-scale" />
                <small>Current AQI (CN): 49.</small>
              </section>
              <section className="weather-card uv-weather">
                <h2>☀ UV index</h2>
                <strong>3</strong>
                <p>Moderate</p>
                <div className="air-scale" />
                <small>Use sun protection this afternoon.</small>
              </section>
              <section className="weather-card sunset-weather">
                <h2>☼ Sunset</h2>
                <strong>17:24</strong>
                <svg viewBox="0 0 200 60" aria-hidden="true">
                  <path
                    d="M0 55Q100 -45 200 55"
                    fill="none"
                    stroke="#9edaff"
                    strokeWidth="4"
                  />
                  <path d="M0 40h200" stroke="#b9e6ff" />
                  <circle cx="128" cy="13" r="5" fill="white" />
                </svg>
                <small>Sunrise: 6:05 AM</small>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
