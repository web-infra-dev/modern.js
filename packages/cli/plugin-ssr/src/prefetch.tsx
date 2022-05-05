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

    renderToStaticMarkup(<App context={context} />);

    if (!context.loaderManager.hasPendingLoaders()) {
      return {
        i18nData: context.__i18nData__,
      };
    }

    const loadersData = await context.loaderManager.awaitPendingLoaders();
    Object.keys(loadersData).forEach(id => {
      const data = loadersData[id];
      if (data.error) {
        ssrContext.logger.error('App Prefetch Loader', data.error);
        ssrContext.metrics.emitCounter('app.prefetch.loader.error');
        data.error =
          data.error instanceof Error ? data.error.message : data.error;
      }
    });

    return {
      loadersData,
      i18nData: context.__i18nData__,
      // todo: move to plugin state
      storeState: context?.store?.getState(),
    };
  });

export default prefetch;
