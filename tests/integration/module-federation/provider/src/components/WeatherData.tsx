import { CurrentWeather, type WeatherData as Data } from '../weather-ui';
export default function WeatherData({ mfData }: { mfData?: Data }) {
  return <CurrentWeather mfData={mfData} />;
}
