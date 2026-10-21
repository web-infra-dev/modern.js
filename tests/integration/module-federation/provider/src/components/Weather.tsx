import { withRenderFailure } from '../render-failure';
import { CurrentWeather } from '../weather-ui';
function Weather({
  local = false,
  labFailure,
}: {
  local?: boolean;
  labFailure?: string;
}) {
  return <CurrentWeather local={local} labFailure={labFailure} />;
}

export default withRenderFailure(Weather);
