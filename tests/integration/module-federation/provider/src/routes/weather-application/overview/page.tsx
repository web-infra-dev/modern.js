import { Link } from '@modern-js/runtime/router';
import {
  CurrentWeather,
  DaysWeather,
  HourlyWeather,
  WindWeather,
} from '../../../weather-ui';
import { AirWeather, UVWeather, SunsetWeather } from '../../../weather-cards';
import { useWeather } from '../state';

export default function Overview() {
  const state = useWeather();
  return (
    <div data-testid="weather-overview">
      <CurrentWeather
        mfData={state.weather}
        location={state.label}
        saved={state.saved}
        onSavedChange={state.setSaved}
      />
      <div className="weather-app-grid">
        <HourlyWeather
          selected={state.selected}
          onSelectedChange={state.setSelected}
          attribution=""
        />
        <DaysWeather
          attribution=""
          renderDay={day => (
            <Link
              to={`../forecast/${day.id}`}
              data-testid={`forecast-${day.id}`}
            >
              {day.day} ↗
            </Link>
          )}
        />
        <WindWeather
          angle={state.angle}
          onAngleChange={state.setAngle}
          attribution=""
        />
        <AirWeather />
        <UVWeather />
        <SunsetWeather />
      </div>
    </div>
  );
}
