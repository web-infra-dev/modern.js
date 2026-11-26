import { loadableReady } from '@loadable/component';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type React from 'react';
import { type Root, hydrateRoot as hydrateReactRoot } from 'react-dom/client';
import { RenderLevel } from '../constants';
import type { TRuntimeContext } from '../context/runtime';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import { WithCallback } from './withCallback';

// React reports a recoverable error for every Suspense boundary that string SSR left at
// its fallback. With deferred loader data (`ssr.deferredDataTimeout`) that is expected:
// those regions render in the browser once their data arrives.
const isDeferredFallbackError = (error: unknown): boolean => {
  if (!window._ROUTER_DATA?.deferredPending) {
    return false;
  }
  const message = String(
    (error as { message?: string } | undefined)?.message ?? error,
  );
  return message.includes('renderToString') && message.includes('Suspense');
};

const reportRecoverableError = (error: unknown) => {
  if (isDeferredFallbackError(error)) {
    return;
  }
  // same as React's default
  if (typeof window.reportError === 'function') {
    window.reportError(error);
  } else {
    console.error(error);
  }
};

export async function hydrateWithReact(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  return hydrateReactRoot(rootElement, App, {
    identifierPrefix: SSR_HYDRATION_ID_PREFIX,
    onRecoverableError: reportRecoverableError,
  });
}

export function hydrateRoot(
  App: React.ReactElement,
  context: TRuntimeContext,
  ModernRender: (App: React.ReactElement) => Promise<HTMLElement | Root>,
  ModernHydrate: (App: React.ReactElement) => Promise<HTMLElement | Root>,
) {
  const hydrateContext: TRuntimeContext & { __hydration?: boolean } = {
    ...context,
    get routes() {
      return context.routes;
    },
    _hydration: true,
  };

  const callback = () => {
    // won't cause component re-render because context's reference identity doesn't change
    delete hydrateContext._hydration;
  };

  // if render level not exist, use client render
  const renderLevel =
    window?._SSR_DATA?.renderLevel || RenderLevel.CLIENT_RENDER;

  const renderMode = window?._SSR_DATA?.mode || 'string';

  if (renderMode === 'stream') {
    return streamSSRHydrate();
  }

  function streamSSRHydrate() {
    if (renderLevel === RenderLevel.SERVER_RENDER) {
      // callback: https://github.com/reactwg/react-18/discussions/5
      const SSRApp: React.FC = () => (
        <WithCallback callback={callback}>{App}</WithCallback>
      );
      return ModernHydrate(
        wrapRuntimeContextProvider(<SSRApp />, hydrateContext),
      );
    } else {
      return ModernRender(wrapRuntimeContextProvider(App, context));
    }
  }

  return stringSSRHydrate();

  function stringSSRHydrate() {
    // client render and server prefetch use same logic
    if (renderLevel === RenderLevel.CLIENT_RENDER) {
      return ModernRender(wrapRuntimeContextProvider(App, context));
    } else if (renderLevel === RenderLevel.SERVER_RENDER) {
      return new Promise<Root | HTMLElement>(resolve => {
        loadableReady(
          () => {
            // callback: https://github.com/reactwg/react-18/discussions/5
            const SSRApp: React.FC = () => (
              <WithCallback callback={callback}>{App}</WithCallback>
            );
            ModernHydrate(
              wrapRuntimeContextProvider(<SSRApp />, hydrateContext),
            ).then(root => {
              resolve(root);
            });
          },
          {
            chunkLoadingGlobal: process.env.MODERN_CHUNK_LOADING_GLOBAL,
          },
        );
      });
    } else {
      // unknown renderlevel or renderlevel is server prefetch.
      console.warn(`unknow render level: ${renderLevel}, execute render()`);
      return ModernRender(wrapRuntimeContextProvider(App, context));
    }
  }
}
