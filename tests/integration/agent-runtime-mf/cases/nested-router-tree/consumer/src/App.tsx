import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() => import('nestedRouterTreeProvider/RemotePanel'));

const initialSnapshot: DemoSnapshot = {
  caseId: 'nested-router-tree',
  page: {
    url: '/console/projects/42/detail',
    status: 'error',
    pendingReason: 'remote router owns a nested history tree',
  },
  route: {
    path: '/console/projects/42/detail',
    basename: '/console',
    matched: true,
    nestedRouterCount: 2,
  },
  components: [
    {
      name: 'HostRouter',
      owner: 'consumer',
      lifecycle: 'ready',
      mounted: true,
    },
    {
      name: 'RemoteRouter',
      owner: 'nestedRouterTreeProvider',
      lifecycle: 'mounted',
      mounted: true,
      duplicateRouter: true,
    },
    {
      name: 'ProjectDetailPage',
      owner: 'nestedRouterTreeProvider',
      lifecycle: 'blocked',
      mounted: false,
    },
  ],
  build: {
    providerName: 'nestedRouterTreeProvider',
    publicPath: 'auto',
  },
  shared: {
    react: { singleton: true, resolvedToHost: true },
    'react-dom': { singleton: true, resolvedToHost: true },
  },
  actions: [
    {
      id: 'flatten-remote-router',
      label: 'Flatten remote router',
      kind: 'custom',
      enabled: true,
    },
  ],
  errors: [
    {
      type: 'route.error',
      component: 'ProjectDetailPage',
      message: 'Remote router created an extra route root.',
    },
  ],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'nested-router-mounted',
    type: 'component.mounted',
    source: 'provider',
    status: 'success',
    message: 'RemoteRouter mounted inside HostRouter.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'nested-router-warning',
    type: 'route.warning',
    source: 'consumer',
    status: 'warning',
    message: 'Two router roots are active for the same page.',
    timestamp: '2026-05-25T00:00:01.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'flatten-remote-router': ({ emit }) => {
    emit({
      type: 'route.recover',
      source: 'consumer',
      status: 'success',
      message: 'Remote route now renders under the host router.',
    });
    return {
      page: {
        status: 'success',
        pendingReason: null,
      },
      route: {
        nestedRouterCount: 1,
      },
      components: [
        {
          name: 'HostRouter',
          owner: 'consumer',
          lifecycle: 'ready',
          mounted: true,
        },
        {
          name: 'ProjectDetailPage',
          owner: 'nestedRouterTreeProvider',
          lifecycle: 'ready',
          mounted: true,
          duplicateRouter: false,
        },
      ],
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
      title="Nested router MF case"
      description="Consumer loads a Modern.js provider and reports route ownership so an agent can separate remote load success from router tree failure."
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

