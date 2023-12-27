import { createElement } from 'react';
import { run } from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { ServerRenderOptions } from '../types';
import { SSRErrors, SSRTimings } from '../tracker';
import renderToPipe from './renderToPipe';

export const render = ({ App, context, config }: ServerRenderOptions) => {
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

    const pipe = renderToPipe(rootElement, context, config, {
      onShellReady() {
        const cost = end();
        tracker.trackTiming(SSRTimings.RENDER_SHELL, cost);
      },
      onAllReady() {
        // calculate streaming ssr cost
        const cost = end();
        tracker.trackTiming(SSRTimings.RENDER_HTML, cost);
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
