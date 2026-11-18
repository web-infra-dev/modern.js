import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  observations,
  stationNames,
  summarize,
  type Observation,
} from './data';
import { useWeather } from '../state';
import './report.css';

const WIDTH = 640,
  HEIGHT = 220,
  LEFT = 40,
  TOP = 15,
  BOTTOM = 190;
const colors = {
  blue: '#2563eb',
  cyan: '#0891b2',
  amber: '#d97706',
  green: '#059669',
  muted: '#94a3b8',
};
const number = (n: number, digits = 1) => n.toFixed(digits);
const x = (index: number, length: number) =>
  LEFT + (index / Math.max(1, length - 1)) * (WIDTH - LEFT - 18);
const y = (value: number, max: number, min = 0) =>
  BOTTOM - ((value - min) / (max - min)) * (BOTTOM - TOP);
function line(
  rows: Observation[],
  field: keyof Observation,
  max: number,
  min = 0,
) {
  return rows
    .map(
      (row, i) =>
        `${i ? 'L' : 'M'}${number(x(i, rows.length))},${number(y(row[field], max, min))}`,
    )
    .join('');
}
function Chart({
  id,
  title,
  detail,
  children,
  legend,
}: {
  id: string;
  title: string;
  detail: string;
  children: ReactNode;
  legend: ReactNode;
}) {
  return (
    <section className="report-chart" data-report-chart={id}>
      <header>
        <div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </div>
      </header>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
        <title>{title}</title>
        {children}
      </svg>
      <div className="report-legend">{legend}</div>
    </section>
  );
}
function Key({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span>
      <i style={{ background: color }} />
      {children}
    </span>
  );
}
function Grid({
  max,
  min = 0,
  unit = '',
}: {
  max: number;
  min?: number;
  unit?: string;
}) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const value = min + ((max - min) * i) / 4;
        return (
          <g key={i}>
            <line
              x1={LEFT}
              x2={WIDTH - 18}
              y1={y(value, max, min)}
              y2={y(value, max, min)}
              stroke="#e6edf4"
            />
            <text x={LEFT - 7} y={y(value, max, min) + 4} textAnchor="end">
              {Math.round(value)}
              {unit}
            </text>
          </g>
        );
      })}
    </>
  );
}
function DateAxis({ rows }: { rows: Observation[] }) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
        const index = Math.round((rows.length - 1) * fraction);
        return (
          <text
            key={fraction}
            x={x(index, rows.length)}
            y="210"
            textAnchor="middle"
          >
            Jun {rows[index].day + 1}
          </text>
        );
      })}
    </>
  );
}
function ReportCharts({
  rows,
  stations,
}: {
  rows: Observation[];
  stations: ReturnType<typeof summarize>[];
}) {
  const days = rows.length / 24;
  const wind = Array.from({ length: 16 }, (_, direction) => {
    const samples = rows.filter(
      row => Math.floor(row.direction / 22.5) === direction,
    );
    return {
      count: samples.length,
      speed:
        samples.reduce((sum, row) => sum + row.speed, 0) /
        Math.max(1, samples.length),
    };
  });
  const windMax = Math.max(...wind.map(bin => bin.count), 1);
  const rank = [...stations].sort((a, b) => b.rain - a.rain).slice(0, 10);
  const heat = (temperature: number) =>
    `hsl(${215 - (temperature - 16) * 9} 68% ${87 - (temperature - 16) * 1.9}%)`;
  return (
    <div className="report-charts">
      <Chart
        id="temperature"
        title="Temperature & comfort"
        detail="Hourly observations · °C"
        legend={
          <>
            <Key color={colors.blue}>Temperature</Key>
            <Key color={colors.amber}>Feels like</Key>
            <Key color={colors.muted}>Seasonal normal</Key>
          </>
        }
      >
        <Grid min={14} max={38} />
        <path
          d={line(rows, 'normal', 38, 14)}
          fill="none"
          stroke={colors.muted}
          strokeDasharray="5 4"
        />
        <path
          d={line(rows, 'temperature', 38, 14)}
          fill="none"
          stroke={colors.blue}
          strokeWidth="2"
        />
        <path
          d={line(rows, 'feels', 38, 14)}
          fill="none"
          stroke={colors.amber}
          strokeWidth="1.5"
        />
        <DateAxis rows={rows} />
      </Chart>
      <Chart
        id="rain"
        title="Rainfall & probability"
        detail="Hourly rainfall · mm / probability · %"
        legend={
          <>
            <Key color={colors.cyan}>Rainfall (0–5 mm)</Key>
            <Key color={colors.blue}>Probability (0–100%)</Key>
          </>
        }
      >
        <Grid max={5} />
        {rows.map((row, i) => (
          <rect
            key={i}
            x={x(i, rows.length)}
            y={y(row.rain, 5)}
            width={Math.max(0.5, (580 / rows.length) * 0.8)}
            height={BOTTOM - y(row.rain, 5)}
            fill={colors.cyan}
          >
            <title>{`Jun ${row.day + 1}, ${row.hour}:00 · ${row.rain} mm`}</title>
          </rect>
        ))}
        <path
          d={line(rows, 'probability', 100)}
          fill="none"
          stroke={colors.blue}
          strokeWidth="1.5"
        />
        <DateAxis rows={rows} />
      </Chart>
      <Chart
        id="air"
        title="Air composition"
        detail="Hourly particulate and ozone concentrations · μg/m³"
        legend={
          <>
            <Key color={colors.blue}>PM2.5</Key>
            <Key color={colors.cyan}>PM10</Key>
            <Key color="#a7d6cc">Ozone</Key>
          </>
        }
      >
        <Grid max={160} />
        {(['pm25', 'pm10', 'ozone'] as const).map((field, layer) => {
          const fields = ['pm25', 'pm10', 'ozone'] as const;
          const lower = rows.map(row =>
            fields.slice(0, layer).reduce((sum, key) => sum + row[key], 0),
          );
          const upper = rows.map((row, i) => lower[i] + row[field]);
          const path =
            upper
              .map(
                (value, i) =>
                  `${i ? 'L' : 'M'}${number(x(i, rows.length))},${number(y(value, 160))}`,
              )
              .join('') +
            lower
              .map((value, i) => ({ value, i }))
              .reverse()
              .map(
                ({ value, i }) =>
                  `L${number(x(i, rows.length))},${number(y(value, 160))}`,
              )
              .join('') +
            'Z';
          return (
            <path
              key={field}
              d={path}
              fill={[colors.blue, colors.cyan, '#a7d6cc'][layer]}
              opacity=".85"
            />
          );
        })}
        <DateAxis rows={rows} />
      </Chart>
      <Chart
        id="stations"
        title="Wettest stations"
        detail="Accumulated rainfall · top 10 stations"
        legend={<Key color={colors.cyan}>Total rainfall (mm)</Key>}
      >
        {rank.map((station, i) => (
          <g key={station.name}>
            <text x="112" y={25 + i * 19} textAnchor="end">
              {station.name}
            </text>
            <rect
              x="122"
              y={14 + i * 19}
              width={(station.rain / Math.max(rank[0].rain, 1)) * 410}
              height="12"
              rx="3"
              fill={colors.cyan}
            >
              <title>{`${station.name}: ${station.rain} mm`}</title>
            </rect>
            <text
              x={130 + (station.rain / Math.max(rank[0].rain, 1)) * 410}
              y={25 + i * 19}
            >
              {station.rain}
            </text>
          </g>
        ))}
      </Chart>
      <Chart
        id="heatmap"
        title="Temperature calendar"
        detail="One cell per hour · all observations retained"
        legend={
          <>
            <Key color={heat(18)}>Cool</Key>
            <Key color={heat(25)}>Mild</Key>
            <Key color={heat(33)}>Warm</Key>
          </>
        }
      >
        {rows.map((row, i) => (
          <rect
            key={i}
            x={LEFT + row.hour * 24}
            y={TOP + (Math.floor(i / 24) * 175) / days}
            width="23"
            height={Math.max(1, 175 / days - 1)}
            fill={heat(row.temperature)}
          >
            <title>{`Jun ${row.day + 1}, ${row.hour}:00 · ${row.temperature}°C`}</title>
          </rect>
        ))}
        {[0, 6, 12, 18, 23].map(hour => (
          <text
            key={hour}
            x={LEFT + hour * 24 + 11}
            y="210"
            textAnchor="middle"
          >
            {hour}:00
          </text>
        ))}
      </Chart>
      <Chart
        id="wind"
        title="Wind distribution"
        detail="16 directions · frequency and mean speed"
        legend={
          <>
            <Key color={colors.blue}>Light wind</Key>
            <Key color={colors.cyan}>Moderate wind</Key>
          </>
        }
      >
        {[30, 55, 80].map(radius => (
          <circle
            key={radius}
            cx="300"
            cy="108"
            r={radius}
            fill="none"
            stroke="#e6edf4"
          />
        ))}
        {wind.map((bin, i) => {
          const angle = ((i * 22.5 - 90) * Math.PI) / 180;
          const radius = 15 + (bin.count / windMax) * 70;
          const point = (r: number, a: number) =>
            `${number(300 + r * Math.cos(a))},${number(108 + r * Math.sin(a))}`;
          return (
            <path
              key={i}
              d={`M${point(12, angle - 0.14)}L${point(radius, angle - 0.14)}A${radius},${radius} 0 0 1 ${point(radius, angle + 0.14)}L${point(12, angle + 0.14)}Z`}
              fill={bin.speed > 11 ? colors.cyan : colors.blue}
            >
              <title>{`${i * 22.5}°: ${bin.count} hours · mean ${number(bin.speed)} km/h`}</title>
            </path>
          );
        })}
        <text x="300" y="16" textAnchor="middle">
          N
        </text>
        <text x="398" y="112">
          E
        </text>
        <text x="300" y="212" textAnchor="middle">
          S
        </text>
        <text x="200" y="112">
          W
        </text>
      </Chart>
    </div>
  );
}

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
