import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() => import('asyncChunkRuntimeProvider/RemotePanel'));

const initialSnapshot: DemoSnapshot = {
  caseId: 'async-chunk-runtime',
  page: {
    url: '/workspace/rivendell',
    status: 'error',
    pendingReason: 'async chunk failed after route transition',
  },
  route: {
    path: '/workspace/rivendell',
    from: '/workspace/home',
    matched: true,
  },
  components: [
    {
      name: 'RivendellRemote',
      remote: 'asyncChunkRuntimeProvider',
      lifecycle: 'loading',
      mounted: false,
    },
  ],
  build: {
    providerName: 'asyncChunkRuntimeProvider',
    publicPath: 'https://cdn.example.com/workspace/',
    uniqueName: 'workspace',
    chunkLoadingGlobal: 'webpackChunk_workspace',
    hostUniqueName: 'workspace',
    conflict: true,
  },
  shared: {
    react: { singleton: true, resolvedToHost: true },
  },
  actions: [
    {
      id: 'isolate-runtime',
      label: 'Isolate runtime',
      kind: 'custom',
      enabled: true,
    },
  ],
  errors: [
    {
      type: 'chunk.error',
      message: 'GET /workspace/static/js/async-panel.js 404',
      chunkId: 'async-panel',
    },
  ],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'async-route-enter',
    type: 'route.change',
    source: 'consumer',
    status: 'success',
    message: 'Entered Rivendell route from workspace home.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'async-chunk-404',
    type: 'chunk.error',
    source: 'provider',
    status: 'error',
    message: 'async-panel chunk requested from the host publicPath and failed.',
    timestamp: '2026-05-25T00:00:01.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'isolate-runtime': ({ emit }) => {
    emit({
      type: 'build.runtime.isolated',
      source: 'consumer',
      status: 'success',
      message: 'uniqueName and chunkLoadingGlobal no longer collide.',
    });
    return {
      page: {
        status: 'success',
        pendingReason: null,
      },
      components: [
        {
          name: 'RivendellRemote',
          remote: 'asyncChunkRuntimeProvider',
          lifecycle: 'ready',
          mounted: true,
        },
      ],
      build: {
        uniqueName: 'rivendell_remote',
        chunkLoadingGlobal: 'webpackChunk_rivendell_remote',
        conflict: false,
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
      title="Async chunk runtime MF case"
      description="Consumer loads a Modern.js provider and reports build/runtime fields that explain why a lazy chunk was fetched from the wrong place."
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

