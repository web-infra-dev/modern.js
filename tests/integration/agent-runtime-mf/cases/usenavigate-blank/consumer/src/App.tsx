import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() => import('useNavigateBlankProvider/RemotePanel'));

const initialSnapshot: DemoSnapshot = {
  caseId: 'usenavigate-blank',
  page: {
    url: '/host/features',
    status: 'success',
    pendingReason: null,
  },
  route: {
    path: '/host/features',
    basename: '/host',
    matched: true,
    lastNavigation: 'initial',
  },
  components: [
    {
      name: 'FeatureList',
      remote: 'useNavigateBlankProvider',
      lifecycle: 'ready',
      mounted: true,
    },
  ],
  build: {
    providerName: 'useNavigateBlankProvider',
    publicPath: 'auto',
  },
  shared: {
    react: { singleton: true, resolvedToHost: true },
  },
  actions: [
    {
      id: 'enter-default-page',
      label: 'Enter default page',
      kind: 'navigation',
      enabled: true,
    },
    {
      id: 'navigate-lineage',
      label: 'Navigate to lineage',
      kind: 'navigation',
      enabled: true,
    },
    {
      id: 'navigate-features',
      label: 'Navigate back to features',
      kind: 'navigation',
      enabled: true,
    },
  ],
  errors: [],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'usenavigate-initial',
    type: 'route.ready',
    source: 'consumer',
    status: 'success',
    message: 'Feature route is mounted under /host.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'enter-default-page': ({ emit }) => {
    emit({
      type: 'route.change',
      source: 'consumer',
      status: 'success',
      message: 'Entered default feature page.',
    });
    return {
      page: {
        url: '/host/features',
        status: 'success',
        pendingReason: null,
      },
      route: {
        path: '/host/features',
        matched: true,
        lastNavigation: 'enter-default-page',
      },
      components: [
        {
          name: 'FeatureList',
          remote: 'useNavigateBlankProvider',
          lifecycle: 'ready',
          mounted: true,
        },
      ],
      errors: [],
    };
  },
  'navigate-lineage': ({ emit }) => {
    emit({
      type: 'route.mismatch',
      source: 'provider',
      status: 'error',
      message: 'useNavigate produced /lineage without the /host basename.',
    });
    return {
      page: {
        url: '/lineage',
        status: 'blank',
        pendingReason: 'basename mismatch after useNavigate',
      },
      route: {
        path: '/lineage',
        basename: '/host',
        matched: false,
        lastNavigation: 'navigate-lineage',
      },
      components: [
        {
          name: 'LineagePage',
          remote: 'useNavigateBlankProvider',
          lifecycle: 'not-mounted',
          mounted: false,
        },
      ],
      errors: [
        {
          type: 'route.mismatch',
          message: 'Route /lineage does not match basename /host.',
        },
      ],
    };
  },
  'navigate-features': ({ emit }) => {
    emit({
      type: 'route.change',
      source: 'provider',
      status: 'success',
      message: 'Returned to /host/features.',
    });
    return {
      page: {
        url: '/host/features',
        status: 'success',
        pendingReason: null,
      },
      route: {
        path: '/host/features',
        basename: '/host',
        matched: true,
        lastNavigation: 'navigate-features',
      },
      components: [
        {
          name: 'FeatureList',
          remote: 'useNavigateBlankProvider',
          lifecycle: 'ready',
          mounted: true,
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
      title="useNavigate blank MF case"
      description="Consumer loads a Modern.js provider and declares route actions so an agent can reproduce the blank page and read the exact route mismatch."
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

