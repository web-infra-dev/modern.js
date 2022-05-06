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
      if (data._error) {
        ssrContext.logger.error('App Prefetch Loader', data._error);
        ssrContext.metrics.emitCounter('app.prefetch.loader.error');
        delete data._error;
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
