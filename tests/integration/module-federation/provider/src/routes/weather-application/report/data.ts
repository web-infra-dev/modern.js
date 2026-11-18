// Fixed observations make SSR, hydration and repeated CSR comparisons identical.
// These are illustrative readings, not a live forecast.
export type Observation = {
  day: number;
  hour: number;
  temperature: number;
  feels: number;
  normal: number;
  rain: number;
  probability: number;
  pm25: number;
  pm10: number;
  ozone: number;
  direction: number;
  speed: number;
};
export const stationNames = [
  'West Lake',
  'Qiantang',
  'Xixi',
  'Binjiang',
  'Gongshu',
  'Xiaoshan',
  'Yuhang',
  'Linping',
  'Fuyang',
  'Lin’an',
  'Tonglu',
  'Jiande',
  'Chun’an',
  'Longjing',
  'Liangzhu',
  'Olympic Park',
  'Airport',
  'Canal',
  'Wulin',
  'Yunqi',
  'Fenghuang',
  'Xianghu',
  'Meijiawu',
  'Dajiangdong',
];
const round = (n: number) => Math.round(n * 10) / 10;
export function observations(
  station: number,
  days = 30,
  reference = 30,
): Observation[] {
  return Array.from({ length: days * 24 }, (_, index) => {
    const day = Math.floor(index / 24),
      hour = index % 24;
    const cycle = Math.sin(((hour - 8) * Math.PI) / 12);
    const weather = Math.sin(day * 0.67 + station * 0.31);
    const temperature =
      reference - 6 + cycle * 5 + weather * 2 + station * 0.07;
    const rain =
      Math.max(0, Math.sin(day * 0.8 + hour * 0.17 + station * 0.1) - 0.64) *
      12;
    return {
      day,
      hour,
      temperature: round(temperature),
      feels: round(temperature + Math.max(0, temperature - 26) * 0.42),
      normal: round(24 + cycle * 4),
      rain: round(rain),
      probability: Math.round(Math.min(98, rain * 14 + 8)),
      pm25: round(12 + (1 + weather) * 14 + Math.max(0, cycle) * 8),
      pm10: round(18 + (1 + Math.cos(day * 0.4)) * 17),
      ozone: round(10 + Math.max(0, cycle) * 30),
      direction: (index * 17 + station * 31 + Math.floor(day / 3) * 47) % 360,
      speed: round(2 + (1 + Math.sin(index * 0.23)) * 9),
    };
  });
}
export function summarize(station: number, days: number, reference = 30) {
  const rows = observations(station, 30, reference).slice(-days * 24);
  return {
    name: stationNames[station],
    station,
    temperature: round(
      rows.reduce((sum, row) => sum + row.temperature, 0) / rows.length,
    ),
    rain: round(rows.reduce((sum, row) => sum + row.rain, 0)),
    peakWind: Math.max(...rows.map(row => row.speed)),
  };
}
