import type { EChartsCoreOption } from 'echarts/core';
import type { Observation, summarize } from './data';

const palette = ['#2563eb', '#0891b2', '#d97706', '#059669'];
type Option = EChartsCoreOption;

export function makeChartOptions(
  rows: Observation[],
  stations: ReturnType<typeof summarize>[],
) {
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
}
