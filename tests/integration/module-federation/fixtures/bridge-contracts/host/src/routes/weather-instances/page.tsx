import { useState } from 'react';
import { createReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';

const Weather = createReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/WeatherApplication'),
  memoryRoute: { entryPath: '/overview' },
});
export default function WeatherInstances() {
  const [mounted, setMounted] = useState(true);
  const [label, setLabel] = useState('Lakeside');
  return (
    <main>
      <button
        data-testid="instances-toggle"
        onClick={() => setMounted(value => !value)}
      >
        Toggle first application
      </button>
      <button
        data-testid="instances-rename"
        onClick={() => setLabel('West Lake')}
      >
        Rename first application
      </button>
      <section data-testid="weather-instance-a">
        {mounted && <Weather label={label} />}
      </section>
      <section data-testid="weather-instance-b">
        <Weather label="Riverside" />
      </section>
    </main>
  );
}
