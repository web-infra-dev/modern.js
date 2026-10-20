import { useState } from 'react';
type Data = {
  source: string;
  temperature: number;
  weather?: 'sunny' | 'rainy';
};
const version = process.env.MF_LAB_VERSION || 'v1';
export default function Forecast({
  mfData,
  id = 'forecast',
}: {
  mfData?: Data;
  id?: string;
}) {
  const [readings, setReadings] = useState(0);
  const weather = mfData?.weather ?? (version === 'v2' ? 'rainy' : 'sunny');
  const temperature = mfData?.temperature ?? (version === 'v2' ? 16 : 24);
  return (
    <article
      className="forecast"
      data-testid={id}
      data-version={version}
      data-weather={weather}
    >
      <div className="weather-icon" aria-hidden="true">
        {weather === 'rainy' ? '☂' : '☀'}
      </div>
      <small>REMOTE WEATHER STATION · {version}</small>
      <h2 data-testid={`${id}-condition`}>
        {weather === 'rainy' ? 'Rain is rolling in.' : 'Clear skies ahead.'}
      </h2>
      <p className="temperature">
        <span data-testid={`${id}-temperature`}>{temperature}</span>
        <span className="degree">°</span>
      </p>
      <p data-testid="data-source">
        {mfData?.source || 'Live from the remote build'}
      </p>
      <p>Lisbon · Atlantic coast</p>
      <button
        data-testid={`${id}-counter`}
        onClick={() => setReadings(value => value + 1)}
      >
        Readings saved: {readings}
      </button>
    </article>
  );
}
