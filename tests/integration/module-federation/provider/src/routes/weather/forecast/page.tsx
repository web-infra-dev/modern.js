import { useLoaderData, useSearchParams } from '@modern-js/runtime/router';

export default function WeatherForecast() {
  const data = useLoaderData() as {
    days: {
      day: string;
      condition: string;
      high: number;
      low: number;
      rain: string;
    }[];
    updatedAt: string;
  };
  const [params, setParams] = useSearchParams();
  const selected = Number(params.get('day')) || 0;
  const day = data.days[selected] || data.days[0];
  return (
    <div data-testid="weather-forecast">
      <p className="bulletin-eyebrow">PLAN AHEAD</p>
      <h2>Your next five days</h2>
      <p className="bulletin-description">
        Room for a walk. A little rain for the garden.
      </p>
      <div className="forecast-days" role="group" aria-label="Daily forecast">
        {data.days.map((item, index) => (
          <button
            type="button"
            key={item.day}
            aria-pressed={selected === index}
            onClick={() => setParams({ day: String(index) })}
            data-testid={`weather-day-${index}`}
          >
            <span>{item.day}</span>
            <span
              className={`forecast-symbol ${index === 2 ? 'rain' : ''}`}
              aria-hidden="true"
            >
              {index === 2 ? '☂' : index === 1 ? '☁' : '☀'}
            </span>
            <strong>
              {item.high}° <small>{item.low}°</small>
            </strong>
          </button>
        ))}
      </div>
      <div
        className="forecast-detail"
        data-testid="weather-day-detail"
        aria-live="polite"
      >
        <strong>
          {day.day} · {day.condition}
        </strong>
        <span>{day.rain} chance of rain</span>
      </div>
      <footer className="bulletin-footnote">
        Five-day outlook · Updated {data.updatedAt}
      </footer>
    </div>
  );
}
