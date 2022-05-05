import { RuntimeContext } from '@modern-js/runtime-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { run } from '@modern-js/utils/ssr';

// todo: SSRContext
const prefetch = async (
  App: React.ComponentType<any>,
  context: RuntimeContext,
) =>
  run(context.ssrContext.request.headers, async () => {
    const { ssrContext } = context;

    try {
      renderToStaticMarkup(<App context={context} />);
    } catch (e) {
      ssrContext.logger.error('App Prefetch Render', e as Error);
      ssrContext.metrics.emitCounter('app.prefetch.render.error');
      throw e;
    }

    if (!context.loaderManager.hasPendingLoaders()) {
      return {
        i18nData: context.__i18nData__,
      };
    }

    let loadersData;
    try {
      loadersData = await context.loaderManager.awaitPendingLoaders();
    } catch (e) {
      ssrContext.logger.error('App Prefetch Loader', e as Error);
      ssrContext.metrics.emitCounter('app.prefetch.loader.error');
      throw e;
    }

    return {
      loadersData,
      i18nData: context.__i18nData__,
      // todo: move to plugin state
      storeState: context?.store?.getState(),
    };
  });

export default prefetch;
