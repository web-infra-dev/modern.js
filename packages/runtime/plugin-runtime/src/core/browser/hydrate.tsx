import { normalizePathname } from '@modern-js/runtime-utils/url';
import { loadableReady } from '@loadable/component';
import React from 'react';
import { Root } from 'react-dom/client';
import { RuntimeContext } from '../context';
import { RenderLevel } from '../constants';
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
    return streamSSRHydrate();
  }

  function streamSSRHydrate() {
    if (renderLevel === RenderLevel.SERVER_RENDER) {
      // callback: https://github.com/reactwg/react-18/discussions/5
      const SSRApp: React.FC = () => (
        <WithCallback callback={callback}>
          {React.cloneElement(App, { _internal_context: hydrateContext })}
        </WithCallback>
      );
      return ModernHydrate(<SSRApp />);
    } else {
      return ModernRender(App);
    }
  }

  return stringSSRHydrate();

  function stringSSRHydrate() {
    // client render and server prefetch use same logic
    if (
      renderLevel === RenderLevel.CLIENT_RENDER ||
      renderLevel === RenderLevel.SERVER_PREFETCH
    ) {
      return ModernRender(App);
    } else if (renderLevel === RenderLevel.SERVER_RENDER) {
      return new Promise<Root | HTMLElement>(resolve => {
        if (isReact18()) {
          loadableReady(() => {
            // callback: https://github.com/reactwg/react-18/discussions/5
            const SSRApp: React.FC = () => (
              <WithCallback callback={callback}>
                {React.cloneElement(App, { _internal_context: hydrateContext })}
              </WithCallback>
            );
            ModernHydrate(<SSRApp />).then(root => {
              resolve(root);
            });
          });
        } else {
          loadableReady(() => {
            ModernHydrate(
              React.cloneElement(App, { _internal_context: hydrateContext }),
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
      return ModernRender(App);
    }
  }
}
