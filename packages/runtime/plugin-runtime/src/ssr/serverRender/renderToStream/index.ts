import { createElement } from 'react';
import { run } from '@modern-js/utils/runtime-node';
import { time } from '@modern-js/utils/universal/time';
import { PreRender } from '../../react/prerender';
import { ServerRenderOptions } from '../types';
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

    const pipe = renderToPipe(rootElement, context, {
      onShellReady() {
        // set cacheConfig
        const cacheConfig = PreRender.config();
        if (cacheConfig) {
          ssrContext.cacheConfig = cacheConfig;
        }
      },
      onAllReady() {
        // calculate streaming ssr cost
        const cost = end();
        ssrContext.logger.debug('App Render To HTML cost = %d ms', cost);
        ssrContext.metrics.emitTimer('app.render.html.cost', cost);
      },
    });
    return pipe;
  });
};
