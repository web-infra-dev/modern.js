import Garfish from 'garfish';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import * as ReactDom from 'react-dom';

declare global {
  interface Window {
    react?: typeof React;
    'react-dom'?: typeof ReactDom;
    __ASYNC_CHUNK_RUNTIME_ERRORS__?: RuntimeErrorRecord[];
    __ASYNC_CHUNK_RUNTIME_ERROR_LISTENER__?: boolean;
  }
}

window.react = React;
window['react-dom'] = ReactDom;

const RemotePanel = lazy(() => import('asyncChunkRuntimeProvider/RemotePanel'));

const rivendellRuntime = {
  appName: 'oceancloud_rivendell',
  garfishEntry: 'http://localhost:4331/garfish/html/index/index.html',
  basename: '/workspace/rivendell',
};

const garfishDomGetter = '#garfish-rivendell-container';
let garfishRegistered = false;

type RuntimeErrorRecord = {
  message: string;
  name?: string;
  request?: string;
};

type PageStatus = 'success' | 'loading' | 'error';

const normalizeRuntimeError = (error: unknown): RuntimeErrorRecord => {
  if (error instanceof Error) {
    const request =
      'request' in error && typeof error.request === 'string'
        ? error.request
        : undefined;
    return {
      name: error.name,
      message: error.message,
      request,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: JSON.stringify(error) };
};

const getRuntimeErrors = () => {
  window.__ASYNC_CHUNK_RUNTIME_ERRORS__ ||= [];
  return window.__ASYNC_CHUNK_RUNTIME_ERRORS__;
};

const recordRuntimeError = (error: unknown) => {
  const record = normalizeRuntimeError(error);
  getRuntimeErrors().push(record);
  return record;
};

const waitForRuntimeError = (fromIndex: number) =>
  new Promise<RuntimeErrorRecord | null>(resolve => {
    window.setTimeout(() => {
      resolve(getRuntimeErrors().slice(fromIndex).at(-1) ?? null);
    }, 1500);
  });

const waitForGarfishRender = () =>
  new Promise<boolean>(resolve => {
    window.setTimeout(() => {
      resolve(
        Boolean(document.querySelector('[data-testid="garfish-swr-probe"]')),
      );
    }, 1500);
  });

if (
  typeof window !== 'undefined' &&
  !window.__ASYNC_CHUNK_RUNTIME_ERROR_LISTENER__
) {
  window.addEventListener('error', event => {
    recordRuntimeError(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', event => {
    recordRuntimeError(event.reason);
  });
  window.__ASYNC_CHUNK_RUNTIME_ERROR_LISTENER__ = true;
}

const ensureGarfishRegistered = () => {
  if (!window.__GARFISH__) {
    Garfish.run({
      basename: '/',
      disablePreloadApp: true,
      sandbox: false,
    });
  }
  if (garfishRegistered) {
    return;
  }
  Garfish.registerApp({
    name: rivendellRuntime.appName,
    entry: rivendellRuntime.garfishEntry,
    basename: rivendellRuntime.basename,
    domGetter: garfishDomGetter,
    cache: false,
    sandbox: false,
  });
  Garfish.setExternal({
    react: React,
    'react-dom': ReactDom,
  });
  garfishRegistered = true;
};

export default function App() {
  const [status, setStatus] = useState<PageStatus>('success');
  const [route, setRoute] = useState('/workspace/home');
  const [pendingReason, setPendingReason] = useState<string | null>(null);
  const [providerLoaded, setProviderLoaded] = useState(false);
  const [garfishMounted, setGarfishMounted] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [loadingGarfish, setLoadingGarfish] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/workspace/home');
    }
  }, []);

  const loadProviderRemote = () => {
    setProviderLoaded(true);
    setStatus('success');
    setPendingReason(null);
  };

  const loadGarfishSubApp = async () => {
    const loadedProviderFirst = providerLoaded;
    const errorStartIndex = getRuntimeErrors().length;
    let loadError: RuntimeErrorRecord | null = null;

    setLoadingGarfish(true);
    setStatus('loading');
    setPendingReason(
      loadedProviderFirst
        ? 'Loading Garfish after the provider remote.'
        : 'Loading Garfish before the provider remote.',
    );
    window.history.pushState(null, '', rivendellRuntime.basename);
    setRoute(rivendellRuntime.basename);

    try {
      ensureGarfishRegistered();
      const app = await Garfish.loadApp(rivendellRuntime.appName, {
        entry: rivendellRuntime.garfishEntry,
        basename: rivendellRuntime.basename,
        domGetter: garfishDomGetter,
        cache: false,
        sandbox: false,
        props: {
          from: '/workspace/home',
          source: 'workbench-menu',
        },
      });
      if (!app) {
        throw new Error('Garfish.loadApp returned empty app instance.');
      }
      if (app.mounted) {
        await app.show();
      } else {
        await app.mount();
      }
    } catch (error) {
      console.error('[async-chunk-runtime] Garfish loadApp failed', error);
      loadError = recordRuntimeError(error);
    }

    const rendered = await waitForGarfishRender();
    const runtimeError =
      loadError || (await waitForRuntimeError(errorStartIndex));
    const renderError =
      !runtimeError && !rendered
        ? {
            name: 'GarfishRenderError',
            message:
              'Garfish sub app loaded but its async content did not render.',
          }
        : null;
    const errorRecord = runtimeError || renderError;

    if (errorRecord) {
      setStatus('error');
      setPendingReason(errorRecord.message);
      setLastError(errorRecord.message);
      setGarfishMounted(false);
    } else {
      setStatus('success');
      setPendingReason(null);
      setLastError(null);
      setGarfishMounted(true);
    }
    setLoadingGarfish(false);
  };

  return (
    <main style={{ display: 'grid', gap: 16, padding: 24 }}>
      <section>
        <h1>Async chunk runtime MF case</h1>
        <p>
          Load the provider remote first, then load the Garfish sub app to
          reproduce the async chunk conflict.
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
        {pendingReason ? (
          <p>
            <strong>Pending reason:</strong> {pendingReason}
          </p>
        ) : null}
        {lastError ? (
          <p role="alert">
            <strong>Error:</strong> {lastError}
          </p>
        ) : null}
      </section>

      <section>
        <button type="button" onClick={loadProviderRemote}>
          Load Provider Remote
        </button>
        <button
          type="button"
          onClick={loadGarfishSubApp}
          disabled={loadingGarfish}
          style={{ marginLeft: 8 }}
        >
          Load Garfish Sub App
        </button>
      </section>

      <section>
        <h2>Remote Provider</h2>
        {providerLoaded ? (
          <Suspense fallback={<div>Loading remote provider...</div>}>
            <RemotePanel />
          </Suspense>
        ) : (
          <div data-testid="remote-panel-placeholder">
            Provider remote has not been loaded.
          </div>
        )}
      </section>

      <section>
        <h2>Garfish Sub App</h2>
        <p>
          <strong>Mounted:</strong> {String(garfishMounted)}
        </p>
        <div
          id="garfish-rivendell-container"
          data-testid="garfish-rivendell-container"
          style={{
            minHeight: 120,
            border: '1px dashed #8c959f',
            padding: 12,
          }}
        >
          <div data-garfish-root>Garfish sub app has not been mounted.</div>
        </div>
      </section>
    </main>
  );
}
