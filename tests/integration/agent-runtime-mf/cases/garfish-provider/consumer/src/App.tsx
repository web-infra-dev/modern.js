import Garfish from 'garfish';
import { Suspense, lazy, useEffect, useState } from 'react';

const RemotePanel = lazy(() => import('garfishProvider/RemotePanel'));

const creativeHubRuntime = {
  appName: 'creative-hub',
  garfishEntry: 'http://localhost:4341/creative-hub',
  basename: '/container/orders',
};

const garfishDomGetter = '#creative-hub-container';
let garfishRegistered = false;

const ensureGarfishRegistered = () => {
  if (!window.__GARFISH__) {
    Garfish.run({
      basename: '/',
      disablePreloadApp: true,
    });
  }
  if (garfishRegistered) {
    return;
  }
  Garfish.registerApp({
    name: creativeHubRuntime.appName,
    entry: creativeHubRuntime.garfishEntry,
    basename: creativeHubRuntime.basename,
    domGetter: garfishDomGetter,
    cache: false,
  });
  garfishRegistered = true;
};

export default function App() {
  const [status, setStatus] = useState<'success' | 'loading' | 'blank'>(
    'success',
  );
  const [route, setRoute] = useState('/container/home');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/container/home');
    }
  }, []);

  const loadCreativeHub = async () => {
    let error = '[Garfish warning]: "provider" is "undefined"';
    setLoading(true);
    setStatus('loading');
    setErrorMessage(null);
    window.history.pushState(null, '', creativeHubRuntime.basename);
    setRoute(creativeHubRuntime.basename);

    try {
      ensureGarfishRegistered();
      const app = await Garfish.loadApp(creativeHubRuntime.appName, {
        entry: creativeHubRuntime.garfishEntry,
        basename: creativeHubRuntime.basename,
        domGetter: garfishDomGetter,
        cache: false,
      });
      if (!app) {
        throw new Error('Garfish.loadApp returned empty app instance.');
      }
      if (app.mounted) {
        await app.show();
      } else {
        await app.mount();
      }
    } catch (loadError) {
      error =
        loadError instanceof Error ? loadError.message : String(loadError);
    }

    setStatus('blank');
    setErrorMessage(error);
    setLoading(false);
  };

  return (
    <main style={{ display: 'grid', gap: 16, padding: 24 }}>
      <section>
        <h1>Garfish provider MF case</h1>
        <p>
          The child app entry is loaded, but Garfish cannot read the expected
          provider export.
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
        {errorMessage ? (
          <p role="alert">
            <strong>Error:</strong> {errorMessage}
          </p>
        ) : null}
      </section>

      <section>
        <button type="button" onClick={loadCreativeHub} disabled={loading}>
          Load Creative Hub
        </button>
      </section>

      <section>
        <h2>Remote Provider</h2>
        <Suspense fallback={<div>Loading remote provider...</div>}>
          <RemotePanel />
        </Suspense>
      </section>

      <section>
        <h2>Garfish Sub App</h2>
        <div
          id="creative-hub-container"
          data-testid="creative-hub-container"
          style={{
            minHeight: 120,
            border: '1px dashed #8c959f',
            padding: 12,
          }}
        >
          <div id="root">Garfish child app has not been mounted.</div>
        </div>
      </section>
    </main>
  );
}
