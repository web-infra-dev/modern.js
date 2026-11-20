import type { makeChartOptions } from './chart-options';
import type { summarize } from './data';

export type ReportQuery = {
  days: number;
  station: number;
  filter: string;
  sort: 'rain' | 'temperature';
  page: number;
};
export type ReportModel = {
  query: ReportQuery;
  stationNames: string[];
  sampleCount: number;
  summary: { average: number; rainfall: number; warm: number; peak: number };
  charts: ReturnType<typeof makeChartOptions>;
  stations: ReturnType<typeof summarize>[];
  stationCount: number;
  pages: number;
};

export async function fetchReport(
  endpoint: string,
  query?: ReportQuery,
  signal?: AbortSignal,
): Promise<ReportModel> {
  const url = new URL(endpoint);
  if (query)
    for (const [key, value] of Object.entries(query))
      url.searchParams.set(key, String(value));
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Climate report returned HTTP ${response.status}`);
  return response.json();
}
