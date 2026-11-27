import { useState } from 'react';
import { createBridgeComponent } from '@modern-js/runtime/mf';
import { CurrentWeather } from '../weather-ui';
function WeatherStation({ label = 'Weather station' }: { label?: string }) {
  const [count, setCount] = useState(0);
  return (
    <section className="independent-station" data-testid="bridge-station">
      <h2>{label}</h2>
      <CurrentWeather local />
      <button
        data-testid="station-observation"
        onClick={() => setCount(value => value + 1)}
      >
        Observations saved: {count}
      </button>
    </section>
  );
}
export default createBridgeComponent({ rootComponent: WeatherStation });
