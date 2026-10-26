import { labComponent } from '../failure/components';
import { Suspense, useState, useEffect, type ComponentType } from 'react';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import {
  ModernRelease,
  DynamicRelease,
  Forecast,
  ClientForecast,
  ClientRecovery,
  ServerRecovery,
  NoData,
  Reload,
} from './remotes';
import BridgeStations from './BridgeStations';
function Replacement({ dynamic }: { dynamic: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [Component, setComponent] = useState<ComponentType<{ id?: string }>>();
  const [status, setStatus] = useState('Version one');
  const name = dynamic ? 'dynamic' : 'provider';
  const forecastId = `${name}-forecast`;
  async function replace() {
    registerRemotes(
      [
        {
          name: dynamic ? 'lab_library' : 'lab_provider',
          alias: dynamic ? 'dynamic' : 'provider',
          entry: `${dynamic ? process.env.MF_LAB_LIBRARY_V2 : process.env.MF_LAB_PROVIDER_V2}/${dynamic ? '' : 'static/'}mf-manifest.json`,
        },
      ],
      { force: true },
    );
    const ReplacementForecast = labComponent<{ id?: string }>(
      {
        loading: <p>Switching versions…</p>,
      },
      `${name}/WeatherRelease`,
      `replacement/${name}`,
    );
    setComponent(() => ReplacementForecast);
    setStatus('Version two');
  }
  return (
    <section className="replacement">
      <div className="controls">
        <span>
          {dynamic ? 'Dynamic Rslib remote' : 'Static Modern remote'} ·{' '}
          <b data-testid={`${name}-version`}>{status}</b>
        </span>
        <button
          data-testid={`replace-${name}`}
          onClick={replace}
          disabled={!ready || Boolean(Component)}
        >
          Switch to rainy forecast ↗
        </button>
      </div>
      <Suspense fallback={<p>Switching versions…</p>}>
        {Component ? (
          <Component id={forecastId} />
        ) : dynamic ? (
          <DynamicRelease id={forecastId} />
        ) : (
          <ModernRelease id={forecastId} />
        )}
      </Suspense>
    </section>
  );
}
function Lifecycle() {
  const [renders, setRenders] = useState(0);
  const [mount, setMount] = useState(0);
  return (
    <>
      <div className="controls">
        <span>
          Parent updates: <b data-testid="parent-renders">{renders}</b>
        </span>
        <div>
          <button
            data-testid="rerender"
            onClick={() => setRenders(value => value + 1)}
          >
            Update page (reuse data)
          </button>
          <button
            data-testid="remount"
            onClick={() => setMount(value => value + 1)}
          >
            Reload station (fetch new data)
          </button>
        </div>
      </div>
      <Reload key={mount} labRemounted={mount > 0} />
      <NoData />
    </>
  );
}
export function WeatherExperiments({
  name,
}: {
  name: 'replace' | 'recovery' | 'lifecycle' | 'bridge' | 'data';
}) {
  switch (name) {
    case 'recovery':
      return (
        <div className="recovery-grid">
          <ClientRecovery />
          <ServerRecovery />
        </div>
      );
    case 'lifecycle':
      return <Lifecycle />;
    case 'data':
      return (
        <>
          <Forecast id="provider-forecast" />
          <ClientForecast id="library-forecast" />
        </>
      );
    case 'bridge':
      return <BridgeStations />;
    case 'replace':
      return (
        <>
          <Replacement dynamic={false} />
          <Replacement dynamic />
        </>
      );
  }
}
