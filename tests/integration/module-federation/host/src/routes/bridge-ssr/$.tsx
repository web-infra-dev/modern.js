import { useState } from 'react';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { LabNav } from '../../components/Comparison';
import './host-controls.css';

const WeatherApplication = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/WeatherApplication'),
  loading: <p role="status">Connecting to the weather station…</p>,
  fallback: ({ retry }) => (
    <section role="alert">
      <p>The weather application is unavailable.</p>
      <button onClick={retry}>Reconnect weather application</button>
    </section>
  ),
});

export default function BridgeWeather() {
  const [label, setLabel] = useState('Hangzhou');
  const [mounted, setMounted] = useState(true);
  return (
    <div>
      <LabNav />
      <details className="weather-host-controls">
        <summary>Application controls</summary>
        <p>
          State belongs to this mounted application. Reconnecting resets it.
        </p>
        <button
          data-testid="application-rename"
          onClick={() =>
            setLabel(value =>
              value === 'Hangzhou' ? 'Hangzhou · West Lake' : 'Hangzhou',
            )
          }
        >
          Change station label
        </button>
        <button
          data-testid="application-toggle"
          onClick={() => setMounted(value => !value)}
        >
          {mounted ? 'Disconnect' : 'Reconnect'} application
        </button>
      </details>
      {mounted && <WeatherApplication label={label} />}
    </div>
  );
}
