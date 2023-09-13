import { createElement } from 'react';
import { run } from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { PreRender } from '../../react/prerender';
import { ServerRenderOptions } from '../types';
import { SSRErrors, SSRTimings } from '../tracker';
import renderToPipe from './renderToPipe';

export const render = ({ App, context }: ServerRenderOptions) => {
  const { ssrContext } = context;

  if (!ssrContext) {
    throw new Error(
      'The "ssrContext" must not be undefined, but received undefined',
    );
  }
  return run(ssrContext.request.headers, async () => {
    const end = time();
    const rootElement = createElement(App, {
      context: Object.assign(context || {}, {
        ssr: true,
      }),
    });

    const { tracker } = ssrContext;

    const pipe = renderToPipe(rootElement, context, {
      onShellReady() {
        // set cacheConfig
        const cacheConfig = PreRender.config();
        if (cacheConfig) {
          ssrContext.cacheConfig = cacheConfig;
        }

        const cost = end();
        tracker.trackTiming(SSRTimings.SSR_RENDER_SHELL, cost);
      },
      onAllReady() {
        // calculate streaming ssr cost
        const cost = end();
        tracker.trackTiming(SSRTimings.SSR_RENDER_TOTAL, cost);
      },
      onShellError(e) {
        // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
        tracker.trackError(SSRErrors.RENDER_SHELL, e as Error);
      },
      onError(error) {
        tracker.trackError(SSRErrors.RENDER_STREAM, error as Error);
      },
    });
    return pipe;
  });
};
