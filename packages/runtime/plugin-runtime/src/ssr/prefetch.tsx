import { renderToStaticMarkup } from 'react-dom/server';
import { run } from '@modern-js/utils/ssr';
import { ChunkExtractor } from '@loadable/server';
import { RuntimeContext } from '../core';

// todo: SSRContext
const prefetch = async (
  App: React.ComponentType<any>,
  context: RuntimeContext,
) =>
  run(context.ssrContext!.request.headers, async () => {
    const { ssrContext } = context;
    const { loadableStats } = ssrContext!;

    if (loadableStats) {
      const extractor = new ChunkExtractor({
        stats: loadableStats,
        entrypoints: [ssrContext!.entryName].filter(Boolean),
      });
      renderToStaticMarkup(extractor.collectChunks(<App context={context} />));
    } else {
      renderToStaticMarkup(<App context={context} />);
    }

    if (!context.loaderManager.hasPendingLoaders()) {
      return {
        initialData: context.initialData,
        i18nData: context.__i18nData__,
      };
    }

    const loadersData = await context.loaderManager.awaitPendingLoaders();
    Object.keys(loadersData).forEach(id => {
      const data = loadersData[id];
      if (data._error) {
        ssrContext!.logger.error('App Prefetch Loader', data._error);
        ssrContext!.metrics.emitCounter('app.prefetch.loader.error', 1);
        delete data._error;
      }
    });

    return {
      loadersData,
      initialData: context.initialData,
      i18nData: context.__i18nData__,
      // todo: move to plugin state
      storeState: context?.store?.getState(),
    };
  });

export default prefetch;
