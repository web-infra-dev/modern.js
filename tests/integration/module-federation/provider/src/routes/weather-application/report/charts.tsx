import { useEffect, useMemo, useRef, useState, useId } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  PolarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { Observation, summarize } from './data';

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  GridComponent,
  LegendComponent,
  PolarComponent,
  TooltipComponent,
  VisualMapComponent,
  SVGRenderer,
]);
const WIDTH = 640,
  HEIGHT = 280;
const palette = ['#2563eb', '#0891b2', '#d97706', '#059669'];
type Option = echarts.EChartsCoreOption;

function renderSVG(option: Option) {
  const chart = echarts.init(null, undefined, {
    renderer: 'svg',
    ssr: true,
    width: WIDTH,
    height: HEIGHT,
  });
  try {
    chart.setOption(option);
    // Preserve the server viewBox while its responsive client renderer loads.
    const svg = chart.renderToSVGString();
    return svg.includes('viewBox=')
      ? svg
      : svg.replace('<svg ', `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" `);
  } finally {
    chart.dispose();
  }
}

function Chart({
  id,
  title,
  detail,
  option,
}: {
  id: string;
  title: string;
  detail: string;
  option: Option;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | undefined>(undefined);
  const chartID = `weather-report-chart-${useId()}`;
  // ECharts owns the SVG subtree. During hydration reuse the exact server SVG,
  // including generated ids, until the normal browser renderer takes over.
  const [initialSVG] = useState(() =>
    typeof window === 'undefined'
      ? renderSVG(option)
      : document.getElementById(chartID)?.innerHTML || '',
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const root = element.current!;
    // Full ECharts appends its renderer, so remove the static SSR SVG at the
    // synchronous handoff rather than leaving two charts in the container.
    root.replaceChildren();
    const chart = echarts.init(root, undefined, {
      renderer: 'svg',
      height: HEIGHT,
    });
    instance.current = chart;
    const resize = new ResizeObserver(() =>
      chart.resize({ width: root.clientWidth, height: HEIGHT }),
    );
    resize.observe(root);
    return () => {
      resize.disconnect();
      instance.current = undefined;
      chart.dispose();
    };
  }, []);
  useEffect(() => {
    instance.current?.setOption(option, { notMerge: true });
    setReady(true);
  }, [option]);
  return (
    <section
      className="report-chart"
      data-report-chart={id}
      data-chart-ready={ready ? 'true' : 'false'}
    >
      <header>
        <h3>{title}</h3>
        <p>{detail}</p>
      </header>
      <div
        id={chartID}
        ref={element}
        className="report-echart"
        role="img"
        aria-label={title}
        data-server-chart={initialSVG ? 'true' : 'false'}
        dangerouslySetInnerHTML={{ __html: initialSVG }}
      />
    </section>
  );
}

export function ReportCharts({
  rows,
  stations,
}: {
  rows: Observation[];
  stations: ReturnType<typeof summarize>[];
}) {
  const options = useMemo(() => {
    const base: Option = {
      animation: false,
      color: palette,
      textStyle: { fontFamily: 'sans-serif', fontSize: 11 },
      grid: { top: 48, right: 36, bottom: 34, left: 48 },
      legend: { top: 6, textStyle: { color: '#60758a', fontSize: 11 } },
      tooltip: { trigger: 'axis', confine: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: rows.map(row => `Jun ${row.day + 1} ${row.hour}:00`),
        axisLabel: { color: '#60758a', hideOverlap: true },
        axisLine: { lineStyle: { color: '#dce7ef' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#60758a' },
        splitLine: { lineStyle: { color: '#e6edf4' } },
      },
    };
    const rank = [...stations]
      .sort((a, b) => b.rain - a.rain)
      .slice(0, 10)
      .reverse();
    const dayNumbers = [...new Set(rows.map(row => row.day + 1))];
    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    const wind = directions.map((_, index) =>
      rows.filter(row => Math.round(row.direction / 22.5) % 16 === index),
    );
    return [
      {
        id: 'temperature',
        title: 'Temperature & comfort',
        detail: 'Hourly observations · °C',
        option: {
          ...base,
          series: [
            {
              name: 'Temperature',
              type: 'line',
              showSymbol: false,
              data: rows.map(row => row.temperature),
            },
            {
              name: 'Feels like',
              type: 'line',
              showSymbol: false,
              data: rows.map(row => row.feels),
            },
            {
              name: 'Seasonal normal',
              type: 'line',
              showSymbol: false,
              lineStyle: { type: 'dashed' },
              data: rows.map(row => row.normal),
            },
          ],
        },
      },
      {
        id: 'rain',
        title: 'Rainfall & probability',
        detail: 'Rainfall · mm / probability · %',
        option: {
          ...base,
          yAxis: [
            {
              type: 'value',
              name: 'mm',
              splitLine: { lineStyle: { color: '#e6edf4' } },
            },
            {
              type: 'value',
              name: '%',
              min: 0,
              max: 100,
              splitLine: { show: false },
            },
          ],
          series: [
            { name: 'Rainfall', type: 'bar', data: rows.map(row => row.rain) },
            {
              name: 'Probability',
              type: 'line',
              showSymbol: false,
              yAxisIndex: 1,
              data: rows.map(row => row.probability),
            },
          ],
        },
      },
      {
        id: 'air',
        title: 'Air composition',
        detail: 'Particulate and ozone concentrations · μg/m³',
        option: {
          ...base,
          series: (['pm25', 'pm10', 'ozone'] as const).map((field, i) => ({
            name: ['PM2.5', 'PM10', 'Ozone'][i],
            type: 'line',
            stack: 'pollutants',
            areaStyle: {},
            showSymbol: false,
            data: rows.map(row => row[field]),
          })),
        },
      },
      {
        id: 'stations',
        title: 'Wettest stations',
        detail: 'Accumulated rainfall · top 10',
        option: {
          ...base,
          grid: { top: 12, right: 40, bottom: 28, left: 100 },
          legend: { show: false },
          xAxis: { type: 'value', name: 'mm' },
          yAxis: {
            type: 'category',
            data: rank.map(row => row.name),
            axisTick: { show: false },
            axisLine: { show: false },
          },
          series: [
            {
              type: 'bar',
              name: 'Rainfall',
              data: rank.map(row => row.rain),
              itemStyle: { color: '#0891b2', borderRadius: [0, 4, 4, 0] },
            },
          ],
        },
      },
      {
        id: 'heatmap',
        title: 'Temperature calendar',
        detail: 'One cell per hour · hover to inspect',
        option: {
          ...base,
          tooltip: { position: 'top', confine: true },
          legend: { show: false },
          grid: { top: 8, right: 16, bottom: 64, left: 52 },
          xAxis: {
            type: 'category',
            data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            splitArea: { show: true },
          },
          yAxis: {
            type: 'category',
            data: dayNumbers.map(day => `Jun ${day}`),
            axisLabel: { hideOverlap: true },
          },
          visualMap: {
            min: 14,
            max: 38,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            inRange: { color: ['#daeafa', '#56b2cc', '#f4cd76', '#d97146'] },
          },
          series: [
            {
              name: 'Temperature',
              type: 'heatmap',
              progressive: 0,
              data: rows.map(row => [
                row.hour,
                dayNumbers.indexOf(row.day + 1),
                row.temperature,
              ]),
            },
          ],
        },
      },
      {
        id: 'wind',
        title: 'Wind distribution',
        detail: '16 directions · hours per wind speed band',
        option: {
          ...base,
          grid: undefined,
          tooltip: { trigger: 'item', confine: true },
          xAxis: undefined,
          yAxis: undefined,
          polar: { radius: [16, '70%'], center: ['50%', '58%'] },
          angleAxis: {
            type: 'category',
            data: directions,
            startAngle: 90,
            axisLabel: { fontSize: 10 },
            axisTick: { show: false },
          },
          radiusAxis: { axisLabel: { show: false } },
          series: [
            {
              name: 'Light (<10 km/h)',
              type: 'bar',
              coordinateSystem: 'polar',
              stack: 'wind',
              data: wind.map(bin => bin.filter(row => row.speed < 10).length),
            },
            {
              name: 'Moderate (≥10 km/h)',
              type: 'bar',
              coordinateSystem: 'polar',
              stack: 'wind',
              data: wind.map(bin => bin.filter(row => row.speed >= 10).length),
            },
          ],
        },
      },
    ];
  }, [rows, stations]);
  return (
    <div className="report-charts">
      {options.map(chart => (
        <Chart key={chart.id} {...chart} />
      ))}
    </div>
  );
}
