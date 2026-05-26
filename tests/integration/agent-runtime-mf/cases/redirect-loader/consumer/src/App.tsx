import { Suspense, lazy, useEffect, useState } from 'react';

const RemotePanel = lazy(() => import('redirectLoaderProvider/RemotePanel'));

type AppProps = {
  initialPath?: '/' | '/home';
};

const loaderId = 'consumer/src/routes/page.loader.ts';

const getDefaultInitialPath = (): '/' | '/home' =>
  typeof window !== 'undefined' && window.location.pathname === '/home'
    ? '/home'
    : '/';

const RootRedirectShell = () => (
  <section data-testid="remote-panel">
    <strong>Consumer: cloud engine root</strong>
    <p>Redirecting to home...</p>
    <p>Expected SSR loader: {loaderId} redirects to /home.</p>
    <p>
      static shell returned 200 and the consumer SSR redirect loader did not run
    </p>
  </section>
);

const DashboardShell = () => (
  <section data-testid="remote-panel">
    <strong>Provider: cloud engine dashboard</strong>
    <p>Dashboard route is ready at /home.</p>
  </section>
);

export default function App({
  initialPath = getDefaultInitialPath(),
}: AppProps) {
  const [canLoadRemote, setCanLoadRemote] = useState(false);
  const [route, setRoute] = useState(initialPath);
  const [status, setStatus] = useState<'pending' | 'success'>(
    initialPath === '/home' ? 'success' : 'pending',
  );

  useEffect(() => {
    setCanLoadRemote(true);
  }, []);

  const runClientFallback = () => {
    window.history.pushState(null, '', '/home');
    setRoute('/home');
    setStatus('success');
  };

  const isDashboard = status === 'success';

  return (
    <main style={{ display: 'grid', gap: 16, padding: 24 }}>
      <section>
        <h1>Redirect loader MF case</h1>
        <p>
          The static shell returned 200 before the root loader redirected to
          /home.
        </p>
      </section>

      <section data-testid="reproduced-issue">
        <h2>Reproduced Issue</h2>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Route:</strong> {route}
        </p>
        {!isDashboard ? (
          <p>
            <strong>Pending reason:</strong> static shell returned 200 and the
            consumer SSR redirect loader did not run
          </p>
        ) : null}
        <p>
          <strong>Loader:</strong> {loaderId} is not_run
        </p>
      </section>

      <section>
        <button type="button" onClick={runClientFallback}>
          Run client fallback
        </button>
      </section>

      <section>
        <h2>Remote Provider</h2>
        {isDashboard ? (
          canLoadRemote ? (
            <Suspense fallback={<DashboardShell />}>
              <RemotePanel />
            </Suspense>
          ) : (
            <DashboardShell />
          )
        ) : (
          <RootRedirectShell />
        )}
      </section>
    </main>
  );
}
