import { loadableReady } from '@loadable/component';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import type React from 'react';
import type { Root } from 'react-dom/client';
import { RenderLevel } from '../constants';
import type { TRuntimeContext } from '../context/runtime';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import { WithCallback } from './withCallback';

export const isReact18 = () => process.env.IS_REACT18 === 'true';

export function hydrateRoot(
  App: React.ReactElement,
  context: TRuntimeContext,
  ModernRender: (App: React.ReactElement) => Promise<HTMLElement | Root>,
  ModernHydrate: (
    App: React.ReactElement,
    callback?: () => void,
  ) => Promise<HTMLElement | Root>,
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

  if (isReact18() && renderMode === 'stream') {
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
