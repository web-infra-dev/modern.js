import { loadableReady } from '@loadable/component';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import type React from 'react';
import type { Root } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RenderLevel } from '../constants';
import type { RuntimeContext } from '../context';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import { WithCallback } from './withCallback';

export const isReact18 = () => process.env.IS_REACT18 === 'true';

export function hydrateRoot(
  App: React.ReactElement,
  context: RuntimeContext,
  ModernRender: (App: React.ReactElement) => Promise<HTMLElement | Root>,
  ModernHydrate: (
    App: React.ReactElement,
    callback?: () => void,
  ) => Promise<HTMLElement | Root>,
) {
  const hydrateContext: RuntimeContext & { __hydration?: boolean } = {
    ...context,
    get routes() {
      return context.routes;
    },
    _hydration: true,
  };

  const { ssrContext } = hydrateContext;

  const currentPathname = normalizePathname(window.location.pathname);
  const initialPathname =
    ssrContext?.request?.pathname &&
    normalizePathname(ssrContext.request.pathname);

  if (
    initialPathname &&
    initialPathname !== currentPathname &&
    context.router
  ) {
    const errorMsg = `The initial URL ${initialPathname} and the URL ${currentPathname} to be hydrated do not match, reload.`;
    console.error(errorMsg);
    window.location.reload();
  }

  const callback = () => {
    // won't cause component re-render because context's reference identity doesn't change
    delete hydrateContext._hydration;
  };

  // if render level not exist, use client render
  const renderLevel =
    window?._SSR_DATA?.renderLevel || RenderLevel.CLIENT_RENDER;

  const renderMode = window?._SSR_DATA?.mode || 'string';

  if (isReact18() && renderMode === 'stream') {
    console.info('streamSSRHydrate');
    return streamSSRHydrate();
  }

  function streamSSRHydrate() {
    console.info('renderLevel', renderLevel);
    if (renderLevel === RenderLevel.SERVER_RENDER) {
      // callback: https://github.com/reactwg/react-18/discussions/5
      const SSRApp: React.FC = () => (
        <WithCallback callback={callback}>{App}</WithCallback>
      );
      return ModernHydrate(
        wrapRuntimeContextProvider(
          // <HelmetProvider>
          <SSRApp />,
          // </HelmetProvider>,
          hydrateContext,
        ),
      );
    } else {
      return ModernRender(wrapRuntimeContextProvider(App, context));
    }
  }

  return stringSSRHydrate();

  function stringSSRHydrate() {
    // client render and server prefetch use same logic
    if (
      renderLevel === RenderLevel.CLIENT_RENDER ||
      renderLevel === RenderLevel.SERVER_PREFETCH
    ) {
      return ModernRender(wrapRuntimeContextProvider(App, context));
    } else if (renderLevel === RenderLevel.SERVER_RENDER) {
      return new Promise<Root | HTMLElement>(resolve => {
        if (isReact18()) {
          loadableReady(() => {
            // callback: https://github.com/reactwg/react-18/discussions/5
            const SSRApp: React.FC = () => (
              <WithCallback callback={callback}>{App}</WithCallback>
            );
            ModernHydrate(
              wrapRuntimeContextProvider(<SSRApp />, hydrateContext),
            ).then(root => {
              resolve(root);
            });
          });
        } else {
          loadableReady(() => {
            ModernHydrate(
              wrapRuntimeContextProvider(App, hydrateContext),
              callback,
            ).then(root => {
              resolve(root);
            });
          });
        }
      });
    } else {
      // unknown renderlevel or renderlevel is server prefetch.
      console.warn(`unknow render level: ${renderLevel}, execute render()`);
      return ModernRender(wrapRuntimeContextProvider(App, context));
    }
  }
}
