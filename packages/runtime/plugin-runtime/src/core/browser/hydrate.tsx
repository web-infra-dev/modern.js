import { loadableReady } from '@loadable/component';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import type React from 'react';
import type { Root } from 'react-dom/client';
import { RenderLevel } from '../constants';
import type { TRuntimeContext } from '../context/runtime';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import { WithCallback } from './withCallback';

export const isReact18 = () => process.env.IS_REACT18 === 'true';

export type HydrationReporter = (event: {
  type: 'start' | 'success' | 'fallback' | 'error' | 'recoverable-error';
  renderLevel: RenderLevel;
  renderMode: string;
  reason?: string;
  root?: HTMLElement | Root;
  error?: unknown;
  errorInfo?: unknown;
}) => void;

export interface ModernHydrateOptions {
  callback?: () => void;
  onRecoverableError?: (error: unknown, errorInfo?: unknown) => void;
}

export function hydrateRoot(
  App: React.ReactElement,
  context: TRuntimeContext,
  ModernRender: (App: React.ReactElement) => Promise<HTMLElement | Root>,
  ModernHydrate: (
    App: React.ReactElement,
    options?: ModernHydrateOptions,
  ) => Promise<HTMLElement | Root>,
  reportHydration?: HydrationReporter,
) {
  const hydrateContext: TRuntimeContext & { __hydration?: boolean } = {
    ...context,
    get routes() {
      return context.routes;
    },
    _hydration: true,
  };

  // if render level not exist, use client render
  const renderLevel =
    window?._SSR_DATA?.renderLevel || RenderLevel.CLIENT_RENDER;

  const renderMode = window?._SSR_DATA?.mode || 'string';

  const report = (event: Parameters<HydrationReporter>[0]) => {
    reportHydration?.(event);
  };
  const reportFallback = async (
    reason: string,
    render: Promise<HTMLElement | Root>,
  ) => {
    try {
      const root = await render;
      report({
        type: 'fallback',
        renderLevel,
        renderMode,
        reason,
        root,
      });
      return root;
    } catch (error) {
      report({
        type: 'error',
        renderLevel,
        renderMode,
        reason,
        error,
      });
      throw error;
    }
  };

  let reportedSuccess = false;
  const reportSuccess = (root?: HTMLElement | Root) => {
    if (reportedSuccess) {
      return;
    }
    reportedSuccess = true;
    report({
      type: 'success',
      renderLevel,
      renderMode,
      root,
    });
  };
  const callback = () => {
    // won't cause component re-render because context's reference identity doesn't change
    delete hydrateContext._hydration;
    reportSuccess();
  };
  const onRecoverableError = (error: unknown, errorInfo?: unknown) => {
    report({
      type: 'recoverable-error',
      renderLevel,
      renderMode,
      reason: 'recoverable-hydration-error',
      error,
      errorInfo,
    });
  };

  report({
    type: 'start',
    renderLevel,
    renderMode,
  });

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
        {
          onRecoverableError,
        },
      )
        .then(root => {
          reportSuccess(root);
          return root;
        })
        .catch(error => {
          report({
            type: 'error',
            renderLevel,
            renderMode,
            error,
          });
          throw error;
        });
    } else {
      return reportFallback(
        'client-render',
        ModernRender(wrapRuntimeContextProvider(App, context)),
      );
    }
  }

  return stringSSRHydrate();

  function stringSSRHydrate() {
    // client render and server prefetch use same logic
    if (renderLevel === RenderLevel.CLIENT_RENDER) {
      return reportFallback(
        'client-render',
        ModernRender(wrapRuntimeContextProvider(App, context)),
      );
    } else if (renderLevel === RenderLevel.SERVER_RENDER) {
      return new Promise<Root | HTMLElement>((resolve, reject) => {
        if (isReact18()) {
          loadableReady(() => {
            // callback: https://github.com/reactwg/react-18/discussions/5
            const SSRApp: React.FC = () => (
              <WithCallback callback={callback}>{App}</WithCallback>
            );
            ModernHydrate(
              wrapRuntimeContextProvider(<SSRApp />, hydrateContext),
              {
                onRecoverableError,
              },
            )
              .then(root => {
                reportSuccess(root);
                resolve(root);
              })
              .catch(error => {
                report({
                  type: 'error',
                  renderLevel,
                  renderMode,
                  error,
                });
                reject(error);
              });
          });
        } else {
          loadableReady(() => {
            ModernHydrate(wrapRuntimeContextProvider(App, hydrateContext), {
              callback,
            })
              .then(root => {
                reportSuccess(root);
                resolve(root);
              })
              .catch(error => {
                report({
                  type: 'error',
                  renderLevel,
                  renderMode,
                  error,
                });
                reject(error);
              });
          });
        }
      });
    } else {
      // unknown renderlevel or renderlevel is server prefetch.
      console.warn(`unknow render level: ${renderLevel}, execute render()`);
      return reportFallback(
        'unknown-render-level',
        ModernRender(wrapRuntimeContextProvider(App, context)),
      );
    }
  }
}
