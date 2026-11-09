import { useLoaderData } from '@modern-js/runtime/router';
import { useState } from 'react';

export default function AirQuality() {
  const data = useLoaderData() as { aqi: number; updatedAt: string };
  const [expanded, setExpanded] = useState(false);
  return (
    <div data-testid="weather-air">
      <p className="bulletin-eyebrow">TAKE A BREATH</p>
      <h2>Fresh air, open windows</h2>
      <div className="air-reading">
        <strong>{data.aqi}</strong>
        <div>
          <span className="air-badge">Good</span>
          <p>Air quality index</p>
        </div>
      </div>
      <div
        className="bulletin-air-scale"
        role="img"
        aria-label={`Air quality ${data.aqi}, good`}
      >
        <span />
      </div>
      <div className="air-scale-labels">
        <span>Good</span>
        <span>Unhealthy</span>
      </div>
      <p className="air-advice">
        A lovely window for a lakeside walk.
        <br />
        No weather warnings in effect.
      </p>
      <button
        className="air-details"
        type="button"
        aria-expanded={expanded}
        data-testid="weather-air-details"
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? 'Hide' : 'View'} pollutant details {expanded ? '−' : '+'}
      </button>
      {expanded && (
        <p data-testid="weather-pollutants">PM2.5: 12 μg/m³ · PM10: 24 μg/m³</p>
      )}
      <footer className="bulletin-footnote">
        Local monitoring · Updated {data.updatedAt}
      </footer>
    </div>
  );
}
