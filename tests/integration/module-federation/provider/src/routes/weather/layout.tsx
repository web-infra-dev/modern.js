import { Outlet, useOutletContext } from '@modern-js/runtime/router';
import { useEffect, useState } from 'react';
import './weather.css';

export default function WeatherLayout() {
  const { label = 'Hangzhou' } = useOutletContext<{ label?: string }>();
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section className="bulletin" data-testid="weather-root" data-ready={ready}>
      <header className="bulletin-location">
        <span data-testid="weather-location">↗ {label}</span>
        <button
          type="button"
          className="bulletin-save"
          aria-label={saved ? 'Unsave location' : 'Save location'}
          aria-pressed={saved}
          disabled={!ready}
          data-testid="weather-save"
          onClick={() => setSaved(value => !value)}
        >
          <span aria-hidden="true">{saved ? '★' : '☆'}</span>
          {saved ? 'Saved' : 'Save'}
        </button>
      </header>
      <Outlet />
    </section>
  );
}
