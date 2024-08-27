import { ChunkExtractor } from '@loadable/server';
import { run } from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { parseHeaders } from '@modern-js/runtime-utils/universal/request';
import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LoaderResult } from '../../loader/loaderManager';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import type { HandleRequestOptions } from '../requestHandler';
import type { SSRConfig } from '../shared';
import { SSRErrors, SSRTimings, type Tracer } from '../tracer';

export const prefetch = async (
  App: React.ReactElement,
  request: Request,
  options: HandleRequestOptions,
  ssrConfig: SSRConfig,
  { onError, onTiming }: Tracer,
) => {
  const headersData = parseHeaders(request);

  const { runtimeContext: context, resource } = options;

  const { entryName, loadableStats } = resource;

  return run(headersData, async () => {
    if (typeof ssrConfig === 'boolean' || !ssrConfig.disablePrerender) {
      try {
        const end = time();
        // disable renderToStaticMarkup when user configures disablePrerender
        if (loadableStats) {
          const extractor = new ChunkExtractor({
            stats: loadableStats,
            entrypoints: [entryName].filter(Boolean),
          });
          renderToStaticMarkup(
            extractor.collectChunks(
              wrapRuntimeContextProvider(
                App,
                Object.assign(context, { ssr: false }),
              ),
            ),
          );
        } else {
          renderToStaticMarkup(
            wrapRuntimeContextProvider(
              App,
              Object.assign(context, { ssr: false }),
            ),
          );
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
        onError(SSRErrors.USE_LOADER, data._error);
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
};
