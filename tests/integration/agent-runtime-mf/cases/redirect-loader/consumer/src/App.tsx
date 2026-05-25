import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() => import('redirectLoaderProvider/RemotePanel'));

const initialSnapshot: DemoSnapshot = {
  caseId: 'redirect-loader',
  page: {
    url: '/',
    status: 'pending',
    pendingReason: 'root loader did not finish redirect decision',
  },
  route: {
    path: '/',
    matched: true,
    redirectedTo: null,
  },
  loaders: [
    {
      id: 'root-loader',
      status: 'pending',
      started: true,
      finished: false,
      redirect: null,
    },
  ],
  components: [
    {
      name: 'RootLoading',
      remote: 'redirectLoaderProvider',
      lifecycle: 'loading',
      mounted: true,
    },
  ],
  build: {
    providerName: 'redirectLoaderProvider',
    publicPath: 'auto',
  },
  shared: {
    react: { singleton: true, resolvedToHost: true },
  },
  actions: [
    {
      id: 'run-client-fallback',
      label: 'Run client fallback',
      kind: 'retry',
      enabled: true,
    },
  ],
  errors: [],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'redirect-loader-start',
    type: 'loader.start',
    source: 'consumer',
    status: 'pending',
    message: 'Root loader started.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'redirect-stuck',
    type: 'page.pending',
    source: 'consumer',
    status: 'pending',
    message: 'Page is still showing redirect loading state.',
    timestamp: '2026-05-25T00:00:01.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'run-client-fallback': ({ emit }) => {
    emit({
      type: 'loader.redirect',
      source: 'consumer',
      status: 'success',
      message: 'Client fallback redirected from root to dashboard.',
    });
    return {
      page: {
        url: '/dashboard',
        status: 'success',
        pendingReason: null,
      },
      route: {
        path: '/dashboard',
        redirectedTo: '/dashboard',
      },
      loaders: [
        {
          id: 'root-loader',
          status: 'success',
          started: true,
          finished: true,
          redirect: '/dashboard',
        },
      ],
      components: [
        {
          name: 'DashboardPage',
          remote: 'redirectLoaderProvider',
          lifecycle: 'ready',
          mounted: true,
        },
      ],
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
      title="Redirect loader MF case"
      description="Consumer loads a Modern.js provider and exposes loader, redirect, and pending reason state instead of asking an agent to guess with sleeps."
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

