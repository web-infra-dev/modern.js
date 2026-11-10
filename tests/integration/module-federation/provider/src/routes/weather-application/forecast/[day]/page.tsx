import { Suspense, useEffect } from 'react';
import {
  Await,
  Link,
  useLoaderData,
  useSearchParams,
} from '@modern-js/runtime/router';
import {
  HourlyWeather,
  WeatherIcon,
  WindWeather,
} from '../../../../weather-ui';
import type { ForecastDay } from '../../../../weather-days';
import { useWeather } from '../../state';

export default function ForecastDetail() {
  const { day, detail, cancelToken } = useLoaderData() as {
    day: ForecastDay;
    detail: Promise<{ detail: string; outlook: string }>;
    cancelToken: string;
  };
  useEffect(() => {
    let pending = true;
    void Promise.resolve(detail).then(
      () => {
        pending = false;
      },
      () => {
        pending = false;
      },
    );
    return () => {
      // A deferred server job may outlive its loader's committed navigation.
      // Cancel exactly this request, including an initially streamed SSR job.
      if (pending)
        void fetch(
          `${process.env.MF_LAB_API}/bridge-data/cancel?token=${cancelToken}`,
          {
            method: 'POST',
            keepalive: true,
          },
        ).catch(() => {});
    };
  }, [detail, cancelToken]);
  const state = useWeather();
  const [params, setParams] = useSearchParams();
  const changeMode = (mode: string) => {
    const next = new URLSearchParams(params);
    next.delete('hold');
    next.delete('failure');
    next.delete('delay');
    if (mode === 'slow') next.set('delay', '3500');
    if (mode === 'failure') next.set('failure', 'data');
    next.set('attempt', String(Number(params.get('attempt') || 0) + 1));
    setParams(next);
  };
  return (
    <section data-testid="weather-detail" data-day={day.id}>
      <header className="weather-app-page-heading">
        <div>
          <Link to="..">← All forecasts</Link>
          <h2>
            {day.day} in {state.label}
          </h2>
          <p>
            {day.rainy ? 'Showers' : 'Partly cloudy'} · H:{day.high}° / L:
            {day.low}°
          </p>
        </div>
        <WeatherIcon rainy={day.rainy} />
        <button
          data-testid="save-day"
          aria-pressed={state.favorites.includes(day.id)}
          onClick={() => state.toggleFavorite(day.id)}
        >
          {state.favorites.includes(day.id) ? '♥ Day saved' : '♡ Save day'}
        </button>
      </header>
      <div className="weather-app-detail-grid">
        <HourlyWeather
          selected={state.selected}
          onSelectedChange={state.setSelected}
          attribution=""
        />
        <WindWeather
          angle={state.angle}
          onAngleChange={state.setAngle}
          attribution=""
        />
        <section className="weather-card weather-outlook">
          <h2>↗ Outdoor outlook</h2>
          <Suspense
            key={`${day.id}:${params}`}
            fallback={
              <p role="status" data-testid="outlook-pending">
                Loading the detailed outlook… You can keep exploring.
              </p>
            }
          >
            <Await
              resolve={detail}
              errorElement={
                <div role="alert" data-testid="outlook-error">
                  <p>The detailed outlook is unavailable.</p>
                  <button
                    data-testid="outlook-retry"
                    onClick={() => changeMode('normal')}
                  >
                    Retry outlook
                  </button>
                </div>
              }
            >
              {value => (
                <div data-testid="outlook-resolved">
                  <p>{value.outlook}</p>
                  <small>{value.detail}</small>
                </div>
              )}
            </Await>
          </Suspense>
        </section>
      </div>
      <details className="weather-app-service">
        <summary>Try the forecast service</summary>
        <p>These controls make real requests to the local sample service.</p>
        <button data-testid="outlook-slow" onClick={() => changeMode('slow')}>
          Load a slow outlook
        </button>
        <button
          data-testid="outlook-fail"
          onClick={() => changeMode('failure')}
        >
          Try a service failure
        </button>
      </details>
    </section>
  );
}
