'use client';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  fetchReport,
  type ReportModel,
  type ReportQuery,
} from './report-model';
import { ReportCharts } from './charts';
import './report.css';

const number = (n: number, digits = 1) => n.toFixed(digits);

export default function ReportContent({
  endpoint,
  initialReport,
  heading,
  method,
}: {
  endpoint: string;
  initialReport: ReportModel;
  heading: ReactNode;
  method: ReactNode;
}) {
  const [interactive, setInteractive] = useState(false);
  const [query, setQuery] = useState(initialReport.query);
  const [report, setReport] = useState(initialReport);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef<AbortController>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    setInteractive(true);
    return () => {
      clearTimeout(timer.current);
      active.current?.abort();
    };
  }, []);

  async function load(next: ReportQuery) {
    const request = new AbortController();
    active.current = request;
    try {
      const result = await fetchReport(endpoint, next, request.signal);
      if (request.signal.aborted) return;
      setReport(result);
      setQuery(result.query);
    } catch (reason) {
      if (!request.signal.aborted) setError(String(reason));
    } finally {
      if (!request.signal.aborted) setPending(false);
    }
  }

  function update(change: Partial<ReportQuery>, debounce = false) {
    const next = { ...query, ...change };
    clearTimeout(timer.current);
    active.current?.abort();
    setQuery(next);
    setError('');
    setPending(true);
    if (debounce) timer.current = setTimeout(() => void load(next), 150);
    else void load(next);
  }

  const { days, station, filter, sort } = query;
  const { stationNames, summary, pages } = report;
  const currentPage = report.query.page;
  return (
    <article
      className="weather-report"
      data-testid="weather-report"
      aria-busy={pending}
      data-report-days={report.query.days}
      data-report-interactive={interactive ? 'true' : 'false'}
    >
      {heading}
      {error && <p role="alert">{error}</p>}
      <div className="report-toolbar">
        <label>
          Period
          <select
            aria-label="Report period"
            disabled={!interactive}
            data-report-control
            value={days}
            onChange={event =>
              update({ days: Number(event.target.value), page: 0 })
            }
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
            onChange={event => update({ station: Number(event.target.value) })}
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
          title="Reference temperature 30°C · Weather Lab fixture"
        >
          {report.sampleCount.toLocaleString('en-US')} station-hours
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
            `${number(summary.average)}°C`,
            stationNames[report.query.station],
          ],
          [
            'Total rainfall',
            `${number(summary.rainfall)} mm`,
            `Across ${report.query.days} days`,
          ],
          ['Heat exposure', `${summary.warm} h`, 'Feels like ≥ 32°C'],
          ['Peak wind', `${number(summary.peak)} km/h`, 'Hourly observation'],
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
          {summary.warm
            ? `${summary.warm} hours of elevated heat exposure. Prioritize shaded routes during the afternoon.`
            : 'No elevated heat exposure in this selection.'}{' '}
          Rainfall is concentrated in short bursts; use the hourly charts to
          plan outdoor work.
        </p>
      </aside>
      <ReportCharts options={report.charts} />
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
              maxLength={100}
              onChange={event =>
                update({ filter: event.target.value, page: 0 }, true)
              }
            />
          </label>
          <label>
            Sort
            <select
              aria-label="Sort report stations"
              value={sort}
              disabled={!interactive}
              onChange={event =>
                update({ sort: event.target.value as typeof sort, page: 0 })
              }
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
            {report.stations.map(item => (
              <tr key={item.name}>
                <td>
                  <button
                    disabled={!interactive}
                    onClick={() => update({ station: item.station })}
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
        {!report.stationCount && <p>No stations match your search.</p>}
        <footer>
          <span>
            {report.stationCount} stations · Page {currentPage + 1} of {pages}
          </span>
          <button
            disabled={!interactive || pending || currentPage === 0}
            onClick={() => update({ page: currentPage - 1 })}
          >
            Previous
          </button>
          <button
            disabled={!interactive || pending || currentPage + 1 >= pages}
            onClick={() => update({ page: currentPage + 1 })}
          >
            Next
          </button>
        </footer>
      </section>
      {method}
    </article>
  );
}
