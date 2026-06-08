import { createRemoteAppComponent } from '@module-federation/modern-js-v3/react';
import { loadRemote } from '@module-federation/modern-js-v3/runtime';
import { useEffect, useState } from 'react';

const RemoteAppFallback = ({ error }: { error: Error }) => (
  <div role="alert">Remote provider failed: {error.message}</div>
);

const RemoteApp = createRemoteAppComponent({
  loader: () => loadRemote('useNavigateBlankProvider/export-app'),
  export: 'provider' as any,
  fallback: RemoteAppFallback,
  loading: <div>Loading remote provider...</div>,
});

type NavigationResultDetail = {
  path?: string;
  basename?: string;
  matched?: boolean;
  view?: string;
  lastNavigation?: string;
};

type PageState = {
  route: string;
  status: 'success' | 'blank';
  error: string | null;
};

const mountedBasename = 'content-understand-feature-lineage';
const mountedRoute = `/${mountedBasename}/features`;

export default function App() {
  const [pageState, setPageState] = useState<PageState>({
    route: mountedRoute,
    status: 'success',
    error: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.history.replaceState(null, '', mountedRoute);
    }

    const onNavigationResult = (event: Event) => {
      const detail =
        (event as CustomEvent<NavigationResultDetail>).detail ?? {};
      const matched = detail.matched !== false;
      const route = detail.path || '/features';
      setPageState({
        route,
        status: matched ? 'success' : 'blank',
        error: matched
          ? null
          : `Route ${route} does not match host mount path.`,
      });
    };
    window.addEventListener(
      'usenavigate-blank:navigation-result',
      onNavigationResult,
    );
    return () => {
      window.removeEventListener(
        'usenavigate-blank:navigation-result',
        onNavigationResult,
      );
    };
  }, []);

  const enterDefaultPage = () => {
    window.dispatchEvent(
      new CustomEvent('usenavigate-blank:navigate', {
        detail: { reset: true },
      }),
    );
    setPageState({
      route: mountedRoute,
      status: 'success',
      error: null,
    });
  };

  const navigateLineage = () => {
    window.dispatchEvent(
      new CustomEvent('usenavigate-blank:navigate', {
        detail: { to: '/lineage' },
      }),
    );
  };

  const navigateFeatures = () => {
    window.dispatchEvent(
      new CustomEvent('usenavigate-blank:navigate', {
        detail: { to: '/features' },
      }),
    );
  };

  return (
    <main style={{ display: 'grid', gap: 16, padding: 24 }}>
      <section>
        <h1>useNavigate blank MF case</h1>
        <p>
          The remote app uses navigation paths that drop the host mount
          basename.
        </p>
      </section>

      <section data-testid="reproduced-issue">
        <h2>Reproduced Issue</h2>
        <p>
          <strong>Status:</strong> {pageState.status}
        </p>
        <p>
          <strong>Route:</strong> {pageState.route}
        </p>
        {pageState.error ? (
          <p role="alert">
            <strong>Error:</strong> {pageState.error}
          </p>
        ) : null}
      </section>

      <section>
        <button type="button" onClick={enterDefaultPage}>
          Enter default page
        </button>
        <button
          type="button"
          onClick={navigateLineage}
          style={{ marginLeft: 8 }}
        >
          Navigate to lineage
        </button>
        <button
          type="button"
          onClick={navigateFeatures}
          style={{ marginLeft: 8 }}
        >
          Navigate back to features
        </button>
      </section>

      <section>
        <h2>Remote Provider</h2>
        <RemoteApp basename={mountedBasename} />
      </section>
    </main>
  );
}
