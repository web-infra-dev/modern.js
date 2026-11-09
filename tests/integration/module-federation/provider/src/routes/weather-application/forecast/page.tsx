import { Link } from '@modern-js/runtime/router';
import { DaysWeather } from '../../../weather-ui';
import { forecastDays } from '../../../weather-days';
import { useWeather } from '../state';

export default function Forecast() {
  const { filter, setFilter } = useWeather();
  const days = forecastDays.filter(
    day => filter === 'all' || (filter === 'showers' ? day.rainy : !day.rainy),
  );
  return (
    <section className="weather-app-list" data-testid="weather-forecast">
      <header className="weather-app-page-heading">
        <div>
          <h2>The days ahead</h2>
          <p>Choose a day for hourly conditions and an outdoor outlook.</p>
        </div>
        <label>
          Conditions{' '}
          <select
            aria-label="Filter forecast"
            value={filter}
            onChange={event => setFilter(event.target.value)}
          >
            <option value="all">All days</option>
            <option value="showers">Showers</option>
            <option value="clear">Partly cloudy</option>
          </select>
        </label>
      </header>
      <DaysWeather
        days={days}
        attribution=""
        renderDay={day => (
          <Link to={day.id} data-testid={`forecast-${day.id}`}>
            {day.day} ↗
          </Link>
        )}
      />
    </section>
  );
}
