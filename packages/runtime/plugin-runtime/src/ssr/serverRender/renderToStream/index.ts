import { createElement } from 'react';
import { run } from '@modern-js/utils/ssr';
import { PreRender } from 'src/ssr/react/prerender';
import type { RuntimeContext, ModernSSRReactComponent } from '../types';
import { time } from '../utils';
import { ServerRenderOptions } from '../types';
import { createTemplates } from './template';
import renderToPipe from './renderToPipe';

export const render = ({ App, context, config }: ServerRenderOptions) => {
  const { ssrContext } = context;

  if (!ssrContext) {
    throw new Error(
      'The "ssrContext" must not be undefined, but received undefined',
    );
  }
  return run(ssrContext.request.headers, async () => {
    const end_all = time();
    // TODO: still need ?
    // const prefetchData = await prefetch(App, context);
    const prefetchData = {};
    const rootElement = createElement(App, {
      context: Object.assign(context || {}, {
        ssr: true,
      }),
    });
    const { jsx, getTemplates } = createTemplates(
      context,
      rootElement,
      prefetchData,
      App,
      config,
    );
    const end = time();
    const pipe = renderToPipe(jsx, getTemplates, {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function prefetch(
    App: ModernSSRReactComponent,
    context: RuntimeContext,
  ) {
    const { prefetch } = App;
    const ssrContext = context.ssrContext!;
    let prefetchData;
    const end = time();

    try {
      prefetchData = prefetch ? await prefetch(context) : null;
      const prefetchCost = end();
      ssrContext.logger.debug(`App Prefetch cost = %d ms`, prefetchCost);
      ssrContext.metrics.emitTimer('app.prefetch.cost', prefetchCost);
    } catch (e) {
      ssrContext.logger.error('App Prefetch Render', e as Error);
      ssrContext.metrics.emitCounter('app.prefetch.render.error', 1);
    }

    return prefetchData || {};
  }
};
