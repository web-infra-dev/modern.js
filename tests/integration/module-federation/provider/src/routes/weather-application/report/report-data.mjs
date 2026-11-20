import { observations, stationNames, summarize } from './data.ts';
import { makeChartOptions } from './chart-options.ts';

// Read date ranges from the same deterministic fixture for all delivery modes.
const records = stationNames.map((_, station) => observations(station));

function queryInt(params, name, max, fallback = 0) {
  const value = Number(params.get(name) ?? fallback);
  return Number.isSafeInteger(value) && value >= 0 && value <= max
    ? value
    : fallback;
}

export function readReport(params) {
  const requestedDays = queryInt(params, 'days', 30, 30);
  const days = [7, 14, 30].includes(requestedDays) ? requestedDays : 30;
  const station = queryInt(params, 'station', stationNames.length - 1);
  const filter = (params.get('filter') ?? '').slice(0, 100);
  const sort = params.get('sort') === 'temperature' ? 'temperature' : 'rain';
  const rows = records[station].slice(-days * 24);
  const stations = records.map((source, index) =>
    summarize(index, source.slice(-days * 24)),
  );
  const ranked = stations
    .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b[sort] - a[sort]);
  const pages = Math.max(1, Math.ceil(ranked.length / 8));
  const page = Math.min(
    queryInt(params, 'page', Number.MAX_SAFE_INTEGER),
    pages - 1,
  );
  return {
    query: { days, station, filter, sort, page },
    stationNames,
    sampleCount: rows.length * stationNames.length,
    summary: {
      average:
        rows.reduce((sum, row) => sum + row.temperature, 0) / rows.length,
      rainfall: rows.reduce((sum, row) => sum + row.rain, 0),
      warm: rows.filter(row => row.feels >= 32).length,
      peak: Math.max(...rows.map(row => row.speed)),
    },
    charts: makeChartOptions(rows, stations),
    stations: ranked.slice(page * 8, page * 8 + 8),
    stationCount: ranked.length,
    pages,
  };
}
