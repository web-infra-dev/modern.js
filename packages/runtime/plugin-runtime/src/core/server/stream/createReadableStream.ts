import { PassThrough, Readable } from 'stream';
import { renderPipeableElement } from '@modern-js/render/html/node';
import { createDocumentStream } from '@modern-js/render/html/stream';
import { storage } from '@modern-js/runtime-utils/node';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type { ReactElement } from 'react';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { getGlobalInternalRuntimeContext } from '../../context';
import { getMonitors } from '../../context/monitors';
import {
  getRouterDeferredResults,
  serializeRouterDeferredResult,
} from './deferredScript';
import type { CreateReadableStreamFromElement } from './shared';
import { getReadableStreamFromString, resolveStreamingMode } from './shared';
import { getTemplates } from './template';

const defaultExtender = {
  modifyRootElement: (rootElement: ReactElement) => rootElement,
  getStyleTags: () => '',
  processStream: (stream: NodeJS.ReadWriteStream) => stream,
};

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    const { runtimeContext, htmlTemplate, config, ssrConfig, entryName } =
      options;
    let renderLevel = RenderLevel.SERVER_RENDER;
    const forceStream2String = Boolean(process.env.MODERN_JS_STREAM_TO_STRING);
    const { onReady } = resolveStreamingMode(request, forceStream2String);
    const extenders =
      getGlobalInternalRuntimeContext().hooks.extendStreamSSR.call() || [];
    if (!extenders.length) extenders.push(defaultExtender);
    for (const extender of extenders)
      extender.init?.({ rootElement, forceStream2String });
    let processedRootElement = rootElement;
    for (const extender of extenders) {
      processedRootElement =
        extender.modifyRootElement?.(processedRootElement) ||
        processedRootElement;
    }

    return new Promise((resolve, reject) => {
      const rendered = renderPipeableElement(processedRootElement, {
        nonce: config.nonce,
        identifierPrefix: SSR_HYDRATION_ID_PREFIX,
        onTiming: options.onTiming,
        [onReady]() {
          options[onReady]?.();
          const styledComponentsStyleTags = extenders
            .map(extender => extender.getStyleTags?.() || '')
            .join('');
          void getTemplates(htmlTemplate, {
            request,
            ssrConfig,
            renderLevel,
            runtimeContext,
            config,
            entryName,
            styledComponentsStyleTags,
          })
            .then(({ shellBefore, shellAfter }) => {
              const passThrough = new PassThrough();
              let processedStream: NodeJS.ReadWriteStream = passThrough;
              for (const extender of extenders) {
                processedStream =
                  extender.processStream?.(processedStream) || processedStream;
              }
              const body = new PassThrough();
              const onStreamError = (error: Error) => body.destroy(error);
              processedStream.on('error', onStreamError);
              body.once('close', () => {
                processedStream.removeListener('error', onStreamError);
                if (
                  !body.readableEnded &&
                  processedStream instanceof Readable
                ) {
                  processedStream.destroy();
                }
              });
              const results = getDeferredResults();
              const stream = createDocumentStream(
                Readable.toWeb(body) as ReadableStream<Uint8Array>,
                {
                  shell: {
                    marker: ESCAPED_SHELL_STREAM_END_MARK,
                    before: shellBefore,
                    after: shellAfter,
                  },
                  identifierPrefix: SSR_HYDRATION_ID_PREFIX,
                  results,
                  serializeResult: result =>
                    serializeRouterDeferredResult(result, config.nonce),
                  onCancel: reason => {
                    rendered.abort(reason);
                    passThrough.destroy();
                  },
                },
              );
              // Registration happens in createDocumentStream.start, before React can pipe.
              resolve(stream);
              processedStream.pipe(body);
              rendered.pipe(passThrough);
            })
            .catch(error => {
              rendered.abort(error);
              reject(error);
            });
        },
        onShellError(error: unknown) {
          renderLevel = RenderLevel.CLIENT_RENDER;
          void getTemplates(htmlTemplate, {
            request,
            ssrConfig,
            renderLevel,
            runtimeContext,
            entryName,
            config,
          })
            .then(({ shellBefore, shellAfter }) => {
              resolve(
                getReadableStreamFromString(`${shellBefore}${shellAfter}`),
              );
              options.onShellError?.(error);
            })
            .catch(reject);
        },
        onError(error: unknown) {
          renderLevel = RenderLevel.CLIENT_RENDER;
          options.onError?.(error);
        },
      });
    });
  };

function getDeferredResults() {
  try {
    const context = storage.useContext?.();
    return getRouterDeferredResults(
      context?.activeDeferreds instanceof Map
        ? Array.from(context.activeDeferreds.entries())
        : [],
      context?.deferredScriptKeys,
    );
  } catch (error) {
    getMonitors().error('cannot inject router data script', error);
    return [];
  }
}
