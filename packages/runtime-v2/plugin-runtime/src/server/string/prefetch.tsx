import { renderToStaticMarkup } from 'react-dom/server';
import { run } from '@modern-js/runtime-utils/node';
import { ChunkExtractor } from '@loadable/server';
import { time } from '@modern-js/runtime-utils/time';
import { RuntimeContext } from '../../core/context';
import { LoaderResult } from '../../core/loader/loaderManager';
import { HandleRequestConfig } from '../requestHandler';
import { SSRErrors, SSRTimings, Tracer } from '../tracer';
// import { SSRPluginConfig } from '';
// import { SSRTracker, SSRTimings, SSRErrors } from './serverRender/tracker';

// todo: SSRContext
export const prefetch = async (
  App: React.ComponentType<any>,
  context: RuntimeContext,
  config: HandleRequestConfig,
  { onError, onTiming }: Tracer,
) =>
  // tracker: SSRTracker,
  run(context.ssrContext.request.headers, async () => {
    const { ssrContext } = context;
    const { loadableStats } = ssrContext;

    if (!config.disablePrerender) {
      try {
        const end = time();
        // disable renderToStaticMarkup when user configures disablePrerender
        if (loadableStats) {
          const extractor = new ChunkExtractor({
            stats: loadableStats,
            entrypoints: [ssrContext.entryName].filter(Boolean),
          });
          renderToStaticMarkup(
            extractor.collectChunks(<App context={context} />),
          );
        } else {
          renderToStaticMarkup(<App context={context} />);
        }

        const cost = end();

        onTiming(SSRTimings.PRERENDER, cost);

        // tracker.trackTiming(SSRTimings.PRERENDER, cost);
      } catch (e) {
        const error = e as Error;
        onError(SSRErrors.PRERENDER, error);

        // re-throw the error
        throw e;
      }
    }

    if (!context.loaderManager.hasPendingLoaders()) {
      return {
        initialData: context.initialData,
        i18nData: context.__i18nData__,
      };
    }

    let loadersData: Record<string, LoaderResult> = {};
    try {
      const end = time();

      loadersData = await context.loaderManager.awaitPendingLoaders();

      const cost = end();

      onTiming(SSRTimings.USE_LOADER, cost);
    } catch (e) {
      onError(SSRErrors.USE_LOADER, e);

      // re-throw the error
      throw e;
    }

    Object.keys(loadersData).forEach(id => {
      const data = loadersData[id];
      if (data._error) {
        ssrContext.logger.error('App Load use-loader', data._error);
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
