import { withRenderFailure } from '../render-failure';
import { CurrentWeather, type WeatherData as Data } from '../weather-ui';
function WeatherData({ mfData }: { mfData?: Data }) {
  return <CurrentWeather mfData={mfData} />;
}

export default withRenderFailure(WeatherData);
