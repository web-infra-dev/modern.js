import { labComponent } from '../failure/components';
import { useSearchParams } from '@modern-js/runtime/router';
import { getInstance } from '@module-federation/enhanced/runtime';
import './remotes';
import { WeatherExperiments } from './WeatherExperiments';
import {
  AirWeather,
  UVWeather,
  SunsetWeather,
} from '../../../provider/src/weather-cards';
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
    void runtime
      .prefetch({
        id: 'provider/WeatherData',
        dataFetchParams: {
          isDowngrade: false,
          labFailure: query.get('failure') || '',
        },
      })
      .catch(() => {
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

const loading = (
  <div className="weather-wait">Connecting to weather station…</div>
);
const Current = labComponent<{ local?: boolean }>(
  { loading },
  'provider/Weather',
);
const Data = labComponent({ loading }, 'provider/WeatherData');
const ClientData = labComponent(
  { loading, noSSR: true },
  'provider/WeatherData',
);
const Hourly = labComponent({ loading }, 'dynamic/WeatherHourly');
const Days = labComponent({ loading }, 'nested/WeatherDays');
const Wind = labComponent({ loading }, 'nested/WeatherWind');
export default function WeatherPage() {
  const [params] = useSearchParams();
  const scenario = params.get('scenario');
  if (
    scenario === 'replace' ||
    scenario === 'recovery' ||
    scenario === 'lifecycle' ||
    scenario === 'bridge' ||
    scenario === 'data'
  ) {
    return (
      <div className="advanced-shell">
        <main className="advanced-stage">
          <WeatherExperiments name={scenario} />
        </main>
      </div>
    );
  }
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
              <AirWeather />
              <UVWeather />
              <SunsetWeather />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
