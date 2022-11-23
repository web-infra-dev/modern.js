import { createElement } from 'react';
import { run } from '@modern-js/utils/ssr';
import { PreRender } from 'src/ssr/react/prerender';
import { time } from '../utils';
import { ServerRenderOptions } from '../types';
import { createTemplates } from './template';
import renderToPipe from './renderToPipe';

export const render = ({ App, context }: ServerRenderOptions) => {
  const { ssrContext } = context;

  if (!ssrContext) {
    throw new Error(
      'The "ssrContext" must not be undefined, but received undefined',
    );
  }
  return run(ssrContext.request.headers, async () => {
    const end_all = time();
    const rootElement = createElement(App, {
      context: Object.assign(context || {}, {
        ssr: true,
      }),
    });

    const getTemplates = createTemplates(context);

    const end = time();
    const pipe = renderToPipe(rootElement, getTemplates, {
      onShellReady() {
        // set cacheConfig
        const cacheConfig = PreRender.config();
        if (cacheConfig) {
          context.ssrContext!.cacheConfig = cacheConfig;
        }
      },
      onAllReady() {
        // computed render html cost
        const cost = end();
        ssrContext.logger.debug('App Render To HTML cost = %d ms', cost);
        ssrContext.metrics.emitTimer('app.render.html.cost', cost);

        // computed all ssr const
        const cost_all = end_all();
        ssrContext.logger.info('App Render Total cost = %d ms', cost_all);
        ssrContext.metrics.emitTimer('app.render.cost', cost_all);
      },
    });
    return pipe;
  });
};
