import { lazy, Suspense, useState } from 'react';
import {
  loadRemote,
  registerRemotes,
} from '@module-federation/modern-js-v3/runtime';
import Signal from 'provider/Signal';
import Relay from 'nested/Relay';
import {
  DynamicSignal,
  DynamicNested,
  Forecast,
  ClientForecast,
  ClientRecovery,
  ServerRecovery,
  NoData,
  Reload,
} from './remotes';
export const scenarios = {
  static: {
    title: 'Across the boundary.',
    description:
      'A component built by another Modern application, rendered on the server and ready to interact.',
    kind: 'Server rendering',
    path: 'Modern provider',
  },
  dynamic: {
    title: 'Connect on demand.',
    description:
      'A remote registered at runtime. A library build joins the same server-rendered experience.',
    kind: 'Dynamic remote',
    path: 'Rslib provider',
  },
  nested: {
    title: 'One more connection.',
    description:
      'The host loads a remote that loads another remote. Every boundary remains a real, independent build.',
    kind: 'Nested rendering',
    path: 'Nested → Modern',
  },
  'dynamic-nested': {
    title: 'Follow the signal.',
    description:
      'A dynamically loaded relay connects to a dynamically registered library remote.',
    kind: 'Dynamic nesting',
    path: 'Nested → Rslib',
  },
  data: {
    title: 'Data makes the journey.',
    description:
      'The remote weather station fetches its data on the server. The first HTML response already carries the forecast.',
    kind: 'Server data',
    path: 'Modern provider → Data',
  },
  csr: {
    title: 'Arrive, then fetch.',
    description:
      'The component renders in the browser while the host retrieves its data from the library’s server bundle.',
    kind: 'Client rendering',
    path: 'Rslib provider → Host server',
  },
  recovery: {
    title: 'Keep the connection.',
    description:
      'Intentional server failures exercise both recovery paths: a client data loader and a retry through the host.',
    kind: 'Data recovery',
    path: 'Server → Recovery',
  },
  lifecycle: {
    title: 'Render. Repeat. Remount.',
    description:
      'Compare a parent rerender with a fresh remote mount. Watch the actual data-loader request count.',
    kind: 'Data lifecycle',
    path: 'Rslib provider → Data',
  },
  replace: {
    title: 'A new signal arrives.',
    description:
      'Replace an already loaded remote with a second independently built version, using the existing runtime API.',
    kind: 'Remote replacement',
    path: 'Version one → Version two',
  },
} as const;
export type ScenarioName = keyof typeof scenarios;
function Replacement({ dynamic }: { dynamic: boolean }) {
  const [Component, setComponent] = useState<ReturnType<typeof lazy>>();
  const [status, setStatus] = useState('Version one');
  const name = dynamic ? 'dynamic' : 'provider';
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
    setComponent(
      lazy(
        () =>
          loadRemote(`${name}/Signal`) as Promise<{
            default: React.ComponentType;
          }>,
      ),
    );
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
          Load version two ↗
        </button>
      </div>
      <Suspense fallback={<p>Switching versions…</p>}>
        {Component ? <Component /> : dynamic ? <DynamicSignal /> : <Signal />}
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
          Parent renders: <b data-testid="parent-renders">{renders}</b>
        </span>
        <div>
          <button
            data-testid="rerender"
            onClick={() => setRenders(value => value + 1)}
          >
            Rerender parent
          </button>
          <button
            data-testid="remount"
            onClick={() => setMount(value => value + 1)}
          >
            Remount remote
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
