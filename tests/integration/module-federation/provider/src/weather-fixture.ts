export type WeatherData = {
  temperature: number;
  condition: string;
  source: string;
  requestId: number;
};
export const fixture: WeatherData = {
  temperature: 30,
  condition: 'Partly cloudy',
  source: 'Local fixture',
  requestId: 0,
};
