import { CurrentWeather } from '../weather-ui';
export default function Weather({ local = false }: { local?: boolean }) {
  return <CurrentWeather local={local} />;
}
