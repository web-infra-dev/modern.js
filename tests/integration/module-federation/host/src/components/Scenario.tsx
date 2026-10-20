import {
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import {
  loadRemote,
  registerRemotes,
} from '@module-federation/modern-js-v3/runtime';
import Signal from 'provider/Signal';
import Relay from 'nested/Relay';
import {
  DynamicSignal,
  DynamicForecast,
  DynamicNested,
  Forecast,
  ClientForecast,
  ClientRecovery,
  ServerRecovery,
  NoData,
  Reload,
} from './remotes';
import type { ScenarioName } from './scenarios';
type ForecastModule = { default: ComponentType<{ id?: string }> };
async function loadForecast(name: string): Promise<ForecastModule> {
  const module = await loadRemote<ForecastModule>(`${name}/Forecast`);
  if (!module) throw new Error(`Remote ${name}/Forecast returned no module`);
  return module;
}
function Replacement({ dynamic }: { dynamic: boolean }) {
  const [Component, setComponent] =
    useState<LazyExoticComponent<ForecastModule['default']>>();
  const [status, setStatus] = useState('Version one');
  const name = dynamic ? 'dynamic' : 'provider';
  const forecastId = `${name}-forecast`;
  async function replace() {
    registerRemotes(
      [
        {
          name: dynamic ? 'dynamic' : 'lab_provider',
          alias: dynamic ? undefined : 'provider',
          entry: `${dynamic ? process.env.MF_LAB_LIBRARY_V2 : process.env.MF_LAB_PROVIDER_V2}/${dynamic ? '' : 'static/'}mf-manifest.json`,
        },
      ],
      { force: true },
    );
    setComponent(lazy(() => loadForecast(name)));
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
          disabled={Boolean(Component)}
        >
          Switch to rainy forecast ↗
        </button>
      </div>
      <Suspense fallback={<p>Switching versions…</p>}>
        {Component ? (
          <Component id={forecastId} />
        ) : dynamic ? (
          <DynamicForecast id={forecastId} />
        ) : (
          <Forecast id={forecastId} />
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
      <Reload key={mount} />
      <NoData />
    </>
  );
}
export function Scenario({ name }: { name: ScenarioName }) {
  switch (name) {
    case 'static':
      return <Signal />;
    case 'dynamic':
      return <DynamicSignal />;
    case 'nested':
      return <Relay />;
    case 'dynamic-nested':
      return <DynamicNested />;
    case 'data':
      return <Forecast />;
    case 'csr':
      return <ClientForecast />;
    case 'recovery':
      return (
        <div className="recovery-grid">
          <ClientRecovery />
          <ServerRecovery />
        </div>
      );
    case 'lifecycle':
      return <Lifecycle />;
    case 'replace':
      return (
        <>
          <Replacement dynamic={false} />
          <Replacement dynamic />
        </>
      );
  }
}
