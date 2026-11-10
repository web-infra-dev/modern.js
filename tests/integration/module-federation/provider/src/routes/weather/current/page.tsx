import { useLoaderData } from '@modern-js/runtime/router';
import { useState } from 'react';

export default function CurrentWeather() {
  const data = useLoaderData() as {
    temperature: number;
    condition: string;
    updatedAt: string;
  };
  const [fahrenheit, setFahrenheit] = useState(false);
  const temperature = (celsius: number) =>
    fahrenheit ? Math.round(celsius * 1.8 + 32) : celsius;
  return (
    <div className="bulletin-current" data-testid="weather-current">
      <p className="bulletin-eyebrow">RIGHT NOW</p>
      <h2>
        A little sunshine.
        <br />A good day outside.
      </h2>
      <div className="current-reading">
        <p className="bulletin-temperature">{temperature(data.temperature)}°</p>
        <div>
          <button
            type="button"
            className="temperature-unit"
            aria-label="Use Fahrenheit"
            aria-pressed={fahrenheit}
            data-testid="weather-unit"
            onClick={() => setFahrenheit(value => !value)}
          >
            {fahrenheit ? '°F' : '°C'} ⇄
          </button>
          <p>{data.condition}</p>
          <small>
            Feels like {temperature(25)}° · H {temperature(26)}° / L{' '}
            {temperature(18)}°
          </small>
        </div>
        <div className="weather-orbit" aria-hidden="true">
          <span />
        </div>
      </div>
      <dl className="current-metrics">
        <div>
          <dt>Humidity</dt>
          <dd>
            64<span>%</span>
          </dd>
        </div>
        <div>
          <dt>NE wind</dt>
          <dd>
            12<span>km/h</span>
          </dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>
            16<span>km</span>
          </dd>
        </div>
      </dl>
      <footer className="bulletin-footnote">
        Updated {data.updatedAt} · Hangzhou observation network
      </footer>
    </div>
  );
}
