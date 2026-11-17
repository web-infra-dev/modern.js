import Weather from 'provider/Weather';
import '../weather-base.css';
import '../../../provider/src/weather-scene.css';
import '../weather.css';

/** The existing /weather document, configured as a compiled static consumer. */
export default function StaticWeatherPage() {
  return (
    <main className="weather-scene">
      <Weather local />
    </main>
  );
}
