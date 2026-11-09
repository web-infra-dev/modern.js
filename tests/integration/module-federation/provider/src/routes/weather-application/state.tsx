import { createContext, useContext } from 'react';
import type { WeatherData } from '../../weather-ui';

export type WeatherState = {
  label: string;
  weather: WeatherData;
  saved: boolean;
  setSaved: (value: boolean) => void;
  favorites: string[];
  toggleFavorite: (day: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  selected: number;
  setSelected: (value: number) => void;
  angle: number;
  setAngle: (value: number) => void;
};
export const WeatherContext = createContext<WeatherState | null>(null);
export function useWeather() {
  const value = useContext(WeatherContext);
  if (!value) throw new Error('Weather page requires the application layout');
  return value;
}
