import { ProducerUpdateControls } from '../../components/ProducerUpdateControls';
import { useState } from 'react';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout } from '../../components/LabLayout';
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
  const [params] = useSearchParams();
  const [label, setLabel] = useState('Hangzhou');
  const [mounted, setMounted] = useState(true);
  const content = (
    <div>
      {!params.has('labFrame') && <ProducerUpdateControls scenario="bridge" />}
      {!params.has('labFrame') && (
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
      description="完整应用的服务端首屏、浏览器接管与版本更新。"
      tabs={[
        { label: '热更新', href: '/?lab=ssr&tab=hmr', active: false },
        {
          label: '缓存与内存',
          href: '/bridge-ssr/forecast/today',
          active: true,
        },
      ]}
    >
      {content}
    </LabLayout>
  );
}
