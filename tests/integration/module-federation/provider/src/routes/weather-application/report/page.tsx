import { useEffect, useMemo, useState } from 'react';
import { observations, stationNames, summarize } from './data';
import { useWeather } from '../state';
import { ReportCharts } from './charts';
import './report.css';

const number = (n: number, digits = 1) => n.toFixed(digits);

export default function WeatherReport() {
  const { weather } = useWeather();
  const reference = weather.temperature;
  const [interactive, setInteractive] = useState(false);
  const [days, setDays] = useState(30);
  const [station, setStation] = useState(0);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<'rain' | 'temperature'>('rain');
  const [page, setPage] = useState(0);
  useEffect(() => setInteractive(true), []);
  const rows = useMemo(
    () => observations(station, 30, reference).slice(-days * 24),
    [station, days, reference],
  );
  const stations = useMemo(
    () => stationNames.map((_, i) => summarize(i, days, reference)),
    [days, reference],
  );
  const charts = useMemo(
    () => <ReportCharts rows={rows} stations={stations} />,
    [rows, stations],
  );
  const stats = useMemo(() => {
    const sorted = stations
      .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => b[sort] - a[sort]);
    const average =
      rows.reduce((sum, row) => sum + row.temperature, 0) / rows.length;
    return {
      stations: sorted,
      average,
      rainfall: rows.reduce((sum, row) => sum + row.rain, 0),
      warm: rows.filter(row => row.feels >= 32).length,
      peak: Math.max(...rows.map(row => row.speed)),
    };
  }, [rows, stations, days, filter, sort]);
  const pages = Math.max(1, Math.ceil(stats.stations.length / 8));
  const currentPage = Math.min(page, pages - 1);
  return (
    <article
      className="weather-report"
      data-testid="weather-report"
      data-report-interactive={interactive ? 'true' : 'false'}
    >
      <header className="report-heading">
        <p>OBSERVATORY / JUNE 2026</p>
        <h2>Hangzhou climate review</h2>
        <span>Illustrative observations · 24 stations · 30 days</span>
      </header>
      <div className="report-toolbar">
        <label>
          Period
          <select
            aria-label="Report period"
            disabled={!interactive}
            data-report-control
            value={days}
            onChange={event => {
              setDays(Number(event.target.value));
              setPage(0);
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
        <label>
          Station
          <select
            aria-label="Report station"
            disabled={!interactive}
            value={station}
            onChange={event => setStation(Number(event.target.value))}
          >
            {stationNames.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span
          className="report-sample-count"
          title={`Reference temperature ${reference}°C · ${weather.source || 'Local data'}`}
        >
          {(rows.length * 24).toLocaleString('en-US')} station-hours
        </span>
      </div>
      <section
        className="report-summary"
        data-testid="report-summary"
        aria-label="Report overview"
      >
        {[
          [
            'Mean temperature',
            `${number(stats.average)}°C`,
            stationNames[station],
          ],
          [
            'Total rainfall',
            `${number(stats.rainfall)} mm`,
            `Across ${days} days`,
          ],
          ['Heat exposure', `${stats.warm} h`, 'Feels like ≥ 32°C'],
          ['Peak wind', `${number(stats.peak)} km/h`, 'Hourly observation'],
        ].map(([label, value, caption]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{caption}</small>
          </div>
        ))}
      </section>
      <aside className="report-risk">
        <b>Weather outlook</b>
        <p>
          {stats.warm
            ? `${stats.warm} hours of elevated heat exposure. Prioritize shaded routes during the afternoon.`
            : 'No elevated heat exposure in this selection.'}{' '}
          Rainfall is concentrated in short bursts; use the hourly charts to
          plan outdoor work.
        </p>
      </aside>
      {charts}
      <section className="report-stations">
        <header>
          <div>
            <h3>Station observations</h3>
            <p>Period aggregates · select a station to update the charts</p>
          </div>
          <label>
            Find station
            <input
              aria-label="Find report station"
              value={filter}
              disabled={!interactive}
              onChange={event => {
                setFilter(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Sort
            <select
              aria-label="Sort report stations"
              value={sort}
              disabled={!interactive}
              onChange={event => setSort(event.target.value as typeof sort)}
            >
              <option value="rain">Rainfall</option>
              <option value="temperature">Temperature</option>
            </select>
          </label>
        </header>
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Mean temperature</th>
              <th>Total rainfall</th>
              <th>Peak wind</th>
            </tr>
          </thead>
          <tbody>
            {stats.stations
              .slice(currentPage * 8, currentPage * 8 + 8)
              .map(item => (
                <tr key={item.name}>
                  <td>
                    <button
                      disabled={!interactive}
                      onClick={() => setStation(item.station)}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td>{item.temperature}°C</td>
                  <td>{item.rain} mm</td>
                  <td>{item.peakWind} km/h</td>
                </tr>
              ))}
          </tbody>
        </table>
        {!stats.stations.length && <p>No stations match your search.</p>}
        <footer>
          <span>
            {stats.stations.length} stations · Page {currentPage + 1} of {pages}
          </span>
          <button
            disabled={!interactive || currentPage === 0}
            onClick={() => setPage(value => value - 1)}
          >
            Previous
          </button>
          <button
            disabled={!interactive || currentPage + 1 >= pages}
            onClick={() => setPage(value => value + 1)}
          >
            Next
          </button>
        </footer>
      </section>
      <section className="report-method" data-report-complete>
        <h3>Reading this report</h3>
        <p>
          The temperature comparison separates the daily cycle from the seasonal
          reference. Rainfall and probability use distinct scales; a high
          probability does not imply a high rainfall total. Air concentrations
          are stacked by pollutant for visual composition, not as a combined
          air-quality index.
        </p>
        <p>
          Station rankings summarize the selected period. The heat calendar
          retains every hourly reading, while the wind rose groups observations
          into sixteen compass sectors. Missing station matches do not change
          the underlying charts.
        </p>
        <small>
          Deterministic fixture data for rendering comparisons. Not for weather
          or health decisions.
        </small>
      </section>
    </article>
  );
}
