import { Suspense, lazy } from 'react';
import {
  AgentRuntimePanel,
  type DemoSnapshot,
  type RuntimeEvent,
  type RuntimeHandlers,
  useDemoRuntime,
} from '../../../../shared/agent-runtime';

const RemotePanel = lazy(() =>
  import('reactMultiVersionProvider/RemotePanel'),
);

const initialSnapshot: DemoSnapshot = {
  caseId: 'react-multi-version',
  page: {
    url: '/checkout',
    status: 'error',
    pendingReason: null,
  },
  route: {
    path: '/checkout',
    basename: '/',
    matched: true,
  },
  components: [
    {
      name: 'CheckoutRemote',
      remote: 'reactMultiVersionProvider',
      lifecycle: 'error',
      mounted: false,
      error: 'Invalid hook call',
    },
  ],
  build: {
    providerName: 'reactMultiVersionProvider',
    publicPath: 'auto',
    uniqueName: 'react_multi_version_provider',
    chunkLoadingGlobal: 'webpackChunk_react_multi_version_provider',
  },
  shared: {
    react: {
      singleton: true,
      hostVersion: '19.2.6',
      remoteVersion: '18.2.0',
      resolvedToHost: false,
    },
    'react-dom': {
      singleton: true,
      hostVersion: '19.2.6',
      remoteVersion: '19.2.6',
      resolvedToHost: true,
    },
  },
  dependencySources: [
    {
      packageName: 'react',
      version: '18.2.0',
      bundled: true,
      issuer: 'legacy-zustand-widget',
      sourceFile: 'provider/src/RemotePanel.tsx',
    },
  ],
  proxy: {
    enabled: false,
    rules: [
      {
        from: 'legacy-zustand-widget/react',
        to: 'host/react',
        matched: false,
      },
    ],
  },
  actions: [
    {
      id: 'apply-proxy-fix',
      label: 'Apply proxy fix',
      kind: 'custom',
      enabled: true,
    },
  ],
  errors: [
    {
      type: 'component.error',
      component: 'CheckoutRemote',
      message: 'Invalid hook call',
    },
  ],
};

const initialEvents: RuntimeEvent[] = [
  {
    id: 'react-shared-warning',
    type: 'shared.resolve',
    source: 'consumer',
    status: 'warning',
    message: 'React resolved to a bundled dependency instead of the host.',
    timestamp: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'react-component-error',
    type: 'component.error',
    source: 'provider',
    status: 'error',
    message: 'CheckoutRemote threw Invalid hook call.',
    timestamp: '2026-05-25T00:00:01.000Z',
  },
];

const handlers: RuntimeHandlers = {
  'apply-proxy-fix': ({ emit }) => {
    emit({
      type: 'proxy.match',
      source: 'consumer',
      status: 'success',
      message: 'React dependency is redirected to the host shared instance.',
    });
    return {
      components: [
        {
          name: 'CheckoutRemote',
          remote: 'reactMultiVersionProvider',
          lifecycle: 'ready',
          mounted: true,
          error: null,
        },
      ],
      shared: {
        react: {
          singleton: true,
          hostVersion: '19.2.6',
          remoteVersion: '19.2.6',
          resolvedToHost: true,
        },
      },
      dependencySources: [
        {
          packageName: 'react',
          version: '19.2.6',
          bundled: false,
          issuer: 'host shared scope',
          sourceFile: 'consumer/module-federation.config.ts',
        },
      ],
      proxy: {
        enabled: true,
        rules: [
          {
            from: 'legacy-zustand-widget/react',
            to: 'host/react',
            matched: true,
          },
        ],
        lastMatchedRule: 'legacy-zustand-widget/react',
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
      title="React multi version MF case"
      description="Consumer loads a Modern.js provider and exposes enough runtime state to prove whether React was shared or bundled."
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

