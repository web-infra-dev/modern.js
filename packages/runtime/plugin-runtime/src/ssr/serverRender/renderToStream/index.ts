import { createElement } from 'react';
import { run } from '@modern-js/utils/ssr';
import type { RuntimeContext, ModernSSRReactComponent } from '../types';
import { createTemplates } from './template';
import renderToPipe from './renderToPipe';

export const render = (
  context: RuntimeContext,
  App: ModernSSRReactComponent,
) => {
  const { ssrContext } = context;

  if (!ssrContext) {
    throw new Error(
      'The "ssrContext" must not be undefined, but received undefined',
    );
  }
  return run(ssrContext.request.headers, async () => {
    const prefetchData = await prefetch(App, context);
    const rootElement = createElement(App, {
      context: Object.assign(context || {}, {
        ssr: true,
      }),
    });
    const { beforeEntry, afterEntry } = createTemplates(
      context,
      rootElement,
      prefetchData,
      App,
    );
    const pipe = renderToPipe(rootElement, {
      beforeEntry,
      afterEntry,
    });
    return pipe;
  });

  async function prefetch(
    App: ModernSSRReactComponent,
    context: RuntimeContext,
  ) {
    const { prefetch } = App;

    let prefetchData;
    // const end = time();

    try {
      prefetchData = prefetch ? await prefetch(context) : null;
      // const prefetchCost = end();
      // this.logger.debug(`App Prefetch cost = %d ms`, prefetchCost);
      // this.metrics.emitTimer('app.prefetch.cost', prefetchCost);
    } catch (e) {
      // this.logger.error('App Prefetch Render', e as Error);s
      // this.metrics.emitCounter('app.prefetch.render.error', 1);
    }

    return prefetchData || {};
  }
};
