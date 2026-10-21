import { checkDataFailure } from './data-failure';
import { useEffect, useState } from 'react';
export type WeatherData = {
  temperature: number;
  condition: string;
  source: string;
  requestId: number;
};
export const fixture: WeatherData = {
  temperature: 30,
  condition: 'Partly cloudy',
  source: 'Local fixture',
  requestId: 0,
};
export function report(event: string) {
  if (typeof window !== 'undefined')
    window.parent.postMessage(
      { type: 'mf-weather', event, at: Math.round(performance.now()) },
      window.location.origin,
    );
}
export function WeatherIcon({ rainy = false }: { rainy?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className="weather-icon"
      aria-label={rainy ? 'Showers' : 'Partly cloudy'}
    >
      <g fill="#ffdb69">
        <circle cx="42" cy="17" r="10" />
        <path
          stroke="#ffdb69"
          strokeWidth="2"
          d="M42 1v4m0 24v4M26 17h4m24 0h5M30 5l3 3m18 18 3 3M30 29l3-3M51 8l3-3"
        />
      </g>
      <path
        fill="#fff"
        d="M14 36a9 9 0 0 1-1-18 13 13 0 0 1 25-1 10 10 0 0 1 5 19Z"
      />
      {rainy && (
        <path
          d="m18 40-3 6m14-6-3 6m14-6-3 6"
          stroke="#79dcff"
          strokeWidth="3"
        />
      )}
    </svg>
  );
}
export function CurrentWeather({
  mfData,
  local = false,
  labFailure,
}: {
  mfData?: WeatherData;
  local?: boolean;
  labFailure?: string;
}) {
  const [data, setData] = useState(local ? fixture : mfData);
  const [error, setError] = useState<Error>();
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setReady(true);
    report('Client ready');
    if (!local && !mfData) {
      checkDataFailure({ labFailure })
        .then(() => fetch(`${process.env.MF_LAB_API}/weather`))
        .then(response => {
          if (!response.ok) throw new Error('Weather API request failed');
          return response.json();
        })
        .then(setData)
        .catch(error => {
          report('Data request failed');
          setError(error);
        });
    }
  }, []);
  useEffect(() => {
    if (data) report('Weather ready');
  }, [data]);
  if (error) throw error;
  return (
    <section
      className="current-weather"
      data-testid="weather-current"
      data-source={data?.source || 'pending'}
    >
      <span className="location-label">⌖ My location</span>
      <h1>Hangzhou</h1>
      <div className="current-temperature">
        {data ? data.temperature : '—'}
        <sup>°</sup>
      </div>
      <p>{data?.condition || 'Waiting for weather'}</p>
      <p>H:30° · L:21°</p>
      <button
        className="weather-save"
        disabled={!ready || !data}
        onClick={() => {
          setSaved(!saved);
          report('Interaction verified');
        }}
        data-testid="weather-save"
      >
        {saved ? '♥ Station saved' : '♡ Save station'}
      </button>
      <small className="weather-source">
        {data?.source || 'No data yet'}
        {data?.requestId ? ` · Request #${data.requestId}` : ''}
      </small>
    </section>
  );
}
export function HourlyWeather() {
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section
      className="weather-card hourly-weather"
      data-testid="weather-hourly"
    >
      <h2>
        ◷ Hourly forecast <small>Dynamic remote · Rslib</small>
      </h2>
      <div className="hours">
        {[30, 29, 28, 27, 26, 25, 24, 23].map((temperature, index) => (
          <button
            key={temperature}
            disabled={!ready}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index);
              report('Interaction verified');
            }}
          >
            <span>{index === 0 ? 'Now' : `${index + 14}:00`}</span>
            <WeatherIcon rainy={index > 4} />
            <b>{temperature}°</b>
          </button>
        ))}
      </div>
      <p className="card-caption">
        {selected === 0 ? 'Now' : `${selected + 14}:00`} · {30 - selected}° ·
        Brief showers this evening.
      </p>
    </section>
  );
}
export function DaysWeather() {
  return (
    <section className="weather-card days-weather" data-testid="weather-days">
      <h2>
        ▦ 5-day forecast <small>Static nested · Modern</small>
      </h2>
      {['Today', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
        <div className="day-row" key={day}>
          <b>{day}</b>
          <WeatherIcon rainy={index % 2 === 1} />
          <span>{21 - index}°</span>
          <div className="temperature-track">
            <i
              style={{
                marginLeft: `${index * 7}%`,
                width: `${75 - index * 8}%`,
              }}
            />
          </div>
          <strong>{30 - index}°</strong>
        </div>
      ))}
    </section>
  );
}
export function WindWeather() {
  const [angle, setAngle] = useState(340);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section className="weather-card wind-weather" data-testid="weather-wind">
      <h2>
        〰 Wind <small>Dynamic nested · Rslib</small>
      </h2>
      <div className="wind-body">
        <div>
          <p>
            Speed <b>4 km/h</b>
          </p>
          <p>
            Gusts <b>9 km/h</b>
          </p>
          <p>
            From <b data-testid="wind-angle">{angle}°</b>
          </p>
        </div>
        <div
          className="wind-map"
          role="img"
          aria-label={`Simulated wind from ${angle} degrees; trails show the downwind direction`}
        >
          <svg
            viewBox="0 0 200 120"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <rect width="200" height="120" fill="#3979a7" />
            <path
              d="M-10-10H145L128 14 142 29 119 40 123 58 98 70 109 83 84 102 89 130H-10Z"
              fill="#70a584"
            />
            <path
              d="M-10 14 61 4 91 27 70 43 95 59 54 79 63 103 29 130H-10Z"
              fill="#8bb58d"
              opacity=".65"
            />
            <path
              d="M200 55 174 70 185 90 156 105 151 130H210Z"
              fill="#7ba889"
            />
            <g fill="none" stroke="#c4d4ab" strokeWidth=".7" opacity=".45">
              <path d="M-5 24Q50 5 90 27T136 28M-5 43Q26 19 68 44T122 53M-5 65Q25 45 58 67T104 83M-5 92Q31 66 68 92T86 111" />
              <path d="M19-10Q55 33 32 64T39 130M62-10Q90 22 74 54T73 130M104-10Q120 15 100 48T95 90" />
            </g>
            <path
              d="M12 0Q78 28 49 59T87 120"
              fill="none"
              stroke="#aed9e0"
              strokeWidth="2"
              opacity=".8"
            />
            <g
              className="wind-flow"
              data-testid="wind-flow"
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: '100px 60px',
              }}
            >
              {Array.from({ length: 24 }, (_, index) => {
                const x = index * 20 - 140;
                return (
                  <path
                    key={index}
                    className="wind-stream"
                    d={`M${x} -160 C${x + 35} -70 ${x - 25} 25 ${x + 8} 90 S${x + 32} 230 ${x - 8} 290`}
                    strokeWidth={index % 3 === 0 ? 1.6 : 1}
                    opacity={0.4 + (index % 4) * 0.15}
                    style={{
                      animationDuration: `${2 + (index % 5) * 0.3}s`,
                      animationDelay: `${-(index % 7) * 0.4}s`,
                    }}
                  />
                );
              })}
            </g>
          </svg>
          <div className="compass">
            <span>N</span>
            <i style={{ transform: `rotate(${angle}deg)` }}>↑</i>
            <span>S</span>
          </div>
          <span className="wind-map-label">Wind flow simulation</span>
        </div>
      </div>
      <label className="wind-control">
        {verified
          ? '✓ Interaction verified'
          : ready
            ? 'Drag to change wind direction'
            : 'Waiting for client'}
        <input
          aria-label="Adjust wind direction"
          type="range"
          min="0"
          max="360"
          value={angle}
          disabled={!ready}
          onChange={event => {
            setAngle(Number(event.target.value));
            setVerified(true);
            report('Interaction verified');
          }}
        />
      </label>
    </section>
  );
}
