import { useState } from 'react';
type Data = { source: string; temperature: number; requests?: number };
export default function Forecast({ mfData }: { mfData?: Data }) {
  const [readings, setReadings] = useState(0);
  return (
    <article className="forecast" data-testid="forecast">
      <div className="weather-icon" aria-hidden="true">
        ☀
      </div>
      <small>REMOTE WEATHER STATION</small>
      <h2>Clear skies ahead.</h2>
      <p className="temperature">
        {mfData?.temperature ?? '—'}
        <span>°</span>
      </p>
      <p data-testid="data-source">
        {mfData?.source || 'Waiting for weather data'}
      </p>
      <p>Lisbon · Atlantic coast</p>
      <button
        data-testid="forecast-counter"
        onClick={() => setReadings(value => value + 1)}
      >
        Readings saved: {readings}
      </button>
    </article>
  );
}
