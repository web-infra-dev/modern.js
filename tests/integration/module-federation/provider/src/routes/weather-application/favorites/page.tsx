import { Link } from '@modern-js/runtime/router';
import { DaysWeather } from '../../../weather-ui';
import { forecastDays } from '../../../weather-days';
import { useWeather } from '../state';

export default function Favorites() {
  const { favorites, saved, label, setSaved } = useWeather();
  return (
    <section className="weather-app-list" data-testid="weather-favorites">
      <header className="weather-app-page-heading">
        <div>
          <h2>Your saved weather</h2>
          <p>Keep the places and days you want to return to.</p>
        </div>
      </header>
      {saved && (
        <div className="weather-card weather-saved-station">
          <Link to="../overview">{label} · Saved station ↗</Link>
          <button onClick={() => setSaved(false)}>Remove station</button>
        </div>
      )}
      {favorites.length > 0 ? (
        <DaysWeather
          days={forecastDays.filter(day => favorites.includes(day.id))}
          attribution=""
          renderDay={day => (
            <Link to={`../forecast/${day.id}`}>{day.day} ↗</Link>
          )}
        />
      ) : (
        <p data-testid="favorites-empty">
          No days saved yet.{' '}
          <Link to="../forecast">Explore the forecast →</Link>
        </p>
      )}
    </section>
  );
}
