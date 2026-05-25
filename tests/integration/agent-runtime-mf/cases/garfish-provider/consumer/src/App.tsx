import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() => import('garfishProvider/RemotePanel'));

const initialSnapshot: DemoSnapshot = {
  caseId: 'garfish-provider',
  page: {
    url: '/container/orders',
    status: 'blank',
    pendingReason: 'entry loaded but provider was not mounted',
  },
  route: {
    path: '/container/orders',
    matched: true,
  },
  components: [
    {
      name: 'OrderProvider',
      remote: 'garfishProvider',
      lifecycle: 'loaded',
      mounted: false,
      ready: false,
    },
  ],
  build: {
    providerName: 'garfishProvider',
    publicPath: 'auto',
  },
  shared: {
    react: { singleton: true, resolvedToHost: true },
  },
  garfish: {
    appName: 'orders',
    entryLoaded: true,
    providerExportFound: false,
    mounted: false,
    active: false,
  },
  actions: [
    {
      id: 'fix-provider-export',
      label: 'Fix provider export',
      kind: 'custom',
      enabled: true,
    },
  ],
  errors: [
    {
      type: 'garfish.provider_missing',
      message: 'Entry script loaded but no provider export was found.',
    },
  ],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'garfish-entry-loaded',
    type: 'entry.loaded',
    source: 'provider',
    status: 'success',
    message: 'Garfish child entry script loaded.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'garfish-provider-missing',
    type: 'garfish.provider_missing',
    source: 'consumer',
    status: 'error',
    message: 'Provider export was not detected after entry load.',
    timestamp: '2026-05-25T00:00:01.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'fix-provider-export': ({ emit }) => {
    emit({
      type: 'garfish.mounted',
      source: 'consumer',
      status: 'success',
      message: 'Provider export exists and the child app mounted.',
    });
    return {
      page: {
        status: 'success',
        pendingReason: null,
      },
      components: [
        {
          name: 'OrderProvider',
          remote: 'garfishProvider',
          lifecycle: 'ready',
          mounted: true,
          ready: true,
        },
      ],
      garfish: {
        providerExportFound: true,
        mounted: true,
        active: true,
      },
      errors: [],
    };
  },
};

export default function App() {
  const { snapshot, events, runtime } = useDemoRuntime(
    initialSnapshot,
    initialEvents,
    handlers,
  );

  return (
    <AgentRuntimePanel
      title="Garfish provider MF case"
      description="Consumer loads a Modern.js provider and keeps entry load, provider export, and mount state visible as separate facts."
      snapshot={snapshot}
      events={events}
      runtime={runtime}
      remoteSlot={
        <Suspense fallback={<div>Loading remote provider...</div>}>
          <RemotePanel />
        </Suspense>
      }
    />
  );
}

