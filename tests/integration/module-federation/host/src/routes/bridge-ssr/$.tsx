import { Button } from '../../components/ui/controls';
import { ProducerUpdateControls } from '../../components/ProducerUpdateControls';
import { useState } from 'react';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { useSearchParams } from '@modern-js/runtime/router';
import { ClickApplication } from '../../components/ClickApplication';
import { LabLayout } from '../../components/LabLayout';
import './host-controls.css';

const WeatherApplication = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/WeatherApplication'),
  loading: <p role="status">Connecting to the weather station…</p>,
  fallback: ({ retry }) => (
    <section role="alert">
      <p>The weather application is unavailable.</p>
      <Button onClick={retry}>Reconnect weather application</Button>
    </section>
  ),
});

export default function BridgeWeather() {
  const [params] = useSearchParams();
  const [label, setLabel] = useState('Hangzhou');
  const [mounted, setMounted] = useState(true);
  if (params.get('bench') === 'bridge')
    return <ClickApplication kind="bridge" />;
  const content = (
    <div>
      {!params.has('labFrame') && <ProducerUpdateControls scenario="bridge" />}
      {!params.has('labFrame') && (
        <details className="weather-host-controls">
          <summary>Application controls</summary>
          <p>
            State belongs to this mounted application. Reconnecting resets it.
          </p>
          <Button
            data-testid="application-rename"
            onClick={() =>
              setLabel(value =>
                value === 'Hangzhou' ? 'Hangzhou · West Lake' : 'Hangzhou',
              )
            }
          >
            Change station label
          </Button>
          <Button
            data-testid="application-toggle"
            onClick={() => setMounted(value => !value)}
          >
            {mounted ? 'Disconnect' : 'Reconnect'} application
          </Button>
        </details>
      )}
      {mounted && <WeatherApplication label={label} />}
    </div>
  );
  return params.has('labFrame') ? (
    content
  ) : (
    <LabLayout
      section="ssr"
      title="Bridge SSR"
      description="Application SSR, hydration and version updates."
      tabs={[
        { label: 'Hot updates', href: '/?lab=ssr&tab=hmr', active: false },
        {
          label: 'Cache & memory',
          href: '/bridge-ssr/forecast/today',
          active: true,
        },
      ]}
    >
      {content}
    </LabLayout>
  );
}
