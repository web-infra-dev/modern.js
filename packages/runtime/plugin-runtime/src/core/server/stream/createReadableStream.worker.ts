import { renderReadableElement } from '@modern-js/render/html/edge';
import { createDocumentStream } from '@modern-js/render/html/stream';
import { storage } from '@modern-js/runtime-utils/node';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import {
  getRouterDeferredResults,
  serializeRouterDeferredResult,
} from './deferredScript';
import type { CreateReadableStreamFromElement } from './shared';
import { getReadableStreamFromString, resolveStreamingMode } from './shared';
import { getTemplates } from './template';

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    const {
      htmlTemplate,
      runtimeContext,
      config,
      ssrConfig,
      entryName,
      rscRoot,
    } = options;
    const { shellBefore, shellAfter } = await getTemplates(htmlTemplate, {
      renderLevel: RenderLevel.SERVER_RENDER,
      runtimeContext,
      ssrConfig,
      request,
      config,
      entryName,
    });
    try {
      const started = performance.now();
      const hasRsc = Boolean(rscRoot);
      const original = hasRsc
        ? await (
            await import('@modern-js/render/ssr')
          ).renderSSRStream(rootElement, {
            request,
            nonce: config.nonce,
            rscRoot: rscRoot!,
            routes: runtimeContext.routes,
            onError: error => options.onError?.(error),
          })
        : await renderReadableElement(rootElement, {
            nonce: config.nonce,
            identifierPrefix: SSR_HYDRATION_ID_PREFIX,
            onTiming: options.onTiming,
            onError: error => options.onError?.(error),
          });
      if (hasRsc) {
        options.onTiming?.('shell', performance.now() - started);
        void original.allReady.then(
          () => options.onTiming?.('all', performance.now() - started),
          () => undefined,
        );
      }
      options.onShellReady?.();
      void original.allReady.then(
        () => options.onAllReady?.(),
        () => undefined,
      );
      const forceStreamToString = Boolean(
        typeof process !== 'undefined' &&
        process.env?.MODERN_JS_STREAM_TO_STRING,
      );
      if (resolveStreamingMode(request, forceStreamToString).waitForAllReady)
        await original.allReady;
      const context = storage.useContext?.();
      return createDocumentStream(original, {
        shell: {
          marker: ESCAPED_SHELL_STREAM_END_MARK,
          before: shellBefore,
          after: shellAfter,
        },
        identifierPrefix: SSR_HYDRATION_ID_PREFIX,
        results: getRouterDeferredResults(
          context?.activeDeferreds instanceof Map
            ? Array.from(context.activeDeferreds.entries())
            : [],
          context?.deferredScriptKeys,
        ),
        serializeResult: result =>
          serializeRouterDeferredResult(result, config.nonce),
      });
    } catch {
      // React's onError already reports render failures.
      return getReadableStreamFromString(`${shellBefore}${shellAfter}`);
    }
  };
