import { renderSSRStream } from '@modern-js/render/ssr';
import { storage } from '@modern-js/runtime-utils/node';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { enqueueFromEntries } from './deferredScript';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  encodeForWebStream,
  getReadableStreamFromString,
  resolveStreamingMode,
} from './shared';
import { getTemplates } from './template';

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    request.signal.throwIfAborted();
    let shellChunkStatus = ShellChunkStatus.START;
    const chunkVec: string[] = [];
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
      const readableOriginal = await renderSSRStream(rootElement, {
        request,
        signal: request.signal,
        nonce: config.nonce,
        rscRoot: rscRoot!,
        routes: runtimeContext.routes,
        onError(error: unknown) {
          options.onError?.(error);
        },
      });

      // If rendering the shell is successful, that Promise will resolve.
      options.onShellReady?.();

      // A Promise that resolves when all rendering is complete
      // call onAllready, when allReady is resolve.
      const allReady = readableOriginal.allReady.then(() => {
        options?.onAllReady?.();
      });
      options.work?.track(allReady);
      // The body and allReady may both reject on cancellation.
      void allReady.catch(() => {});

      // However, when a crawler visits your page, or if you're generating the pages at the build time,
      // you might want to let all of the content load first and then produce the final HTML output instead of revealing it progressively.
      // from: https://react.dev/reference/react-dom/server/renderToReadableStream#handling-different-errors-in-different-ways
      const forceStreamToString = Boolean(
        typeof process !== 'undefined' &&
          process.env?.MODERN_JS_STREAM_TO_STRING,
      );
      const { waitForAllReady } = resolveStreamingMode(
        request,
        forceStreamToString,
      );

      if (waitForAllReady) {
        // Prefer to wait for full content when instructed by middleware marker/env/isbot.
        await readableOriginal.allReady;
      }

      const reader = readableOriginal.getReader();

      let isClosed = false;
      const cancellation = new AbortController();
      const pendingScripts: string[] = [];
      let cancelling: Promise<void> | undefined;
      let cancelReader: (reason: unknown) => Promise<void>;
      const abort = () => {
        void cancelReader(request.signal.reason).catch(() => {});
      };
      const stream = new ReadableStream({
        start(controller) {
          cancelReader = reason => {
            if (cancelling) return cancelling;
            if (isClosed) return Promise.resolve();
            isClosed = true;
            cancellation.abort(reason);
            pendingScripts.length = 0;
            request.signal.removeEventListener('abort', abort);
            try {
              controller.error(reason);
            } catch {
              /* Already cancelled. */
            }
            cancelling = reader.cancel(reason);
            options.work?.track(cancelling);
            return cancelling;
          };
          request.signal.addEventListener('abort', abort, { once: true });
          if (request.signal.aborted) abort();

          const safeEnqueue = (chunk: Uint8Array | unknown) => {
            if (isClosed) return;
            try {
              controller.enqueue(chunk as Uint8Array);
            } catch (error) {
              void cancelReader(error).catch(() => {});
            }
          };

          const closeController = () => {
            if (!isClosed) {
              isClosed = true;
              request.signal.removeEventListener('abort', abort);
              try {
                controller.close();
              } catch {
                // Controller already closed
              }
            }
          };

          const flushPendingScripts = () => {
            for (const s of pendingScripts) {
              safeEnqueue(encodeForWebStream(s));
            }
            pendingScripts.length = 0;
          };

          const enqueueScript = (script: string) => {
            if (isClosed) return;
            if (shellChunkStatus === ShellChunkStatus.FINISH) {
              safeEnqueue(encodeForWebStream(script));
            } else {
              pendingScripts.push(script);
            }
          };

          const storageContext = storage.useContext?.();
          const activeDeferreds = storageContext?.activeDeferreds;
          /**
           * activeDeferreds is injected into storageContext by @modern-js/runtime.
           * @see packages/toolkit/runtime-utils/src/browser/nestedRoutes.tsx
           */
          const entries: Array<[string, unknown]> =
            activeDeferreds instanceof Map
              ? Array.from(activeDeferreds.entries())
              : [];

          const deferredWork = enqueueFromEntries(
            entries,
            config.nonce,
            enqueueScript,
            cancellation.signal,
          );
          options.work?.track(deferredWork);
          void deferredWork.catch(error => {
            void cancelReader(error).catch(() => {});
          });

          async function push() {
            try {
              const { done, value } = await reader.read();
              if (done) {
                await deferredWork;
                closeController();
                return;
              }

              if (isClosed) return;

              if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                chunkVec.push(new TextDecoder().decode(value));
                const concatedChunk = chunkVec.join('');

                /**
                 * React's chunk boundaries are byte-driven, so the marker can
                 * land in the middle of a chunk that already carries
                 * suspense-boundary content emitted right after the shell.
                 * Split at the marker: content before goes between
                 * shellBefore and shellAfter; content after is emitted as-is
                 * so it lands past the closing `</html>` rather than being
                 * swallowed inside it.
                 */
                const markerIndex = concatedChunk.indexOf(
                  ESCAPED_SHELL_STREAM_END_MARK,
                );
                if (markerIndex !== -1) {
                  const beforeMark = concatedChunk.slice(0, markerIndex);
                  const afterMark = concatedChunk.slice(
                    markerIndex + ESCAPED_SHELL_STREAM_END_MARK.length,
                  );

                  shellChunkStatus = ShellChunkStatus.FINISH;
                  safeEnqueue(
                    encodeForWebStream(
                      `${shellBefore}${beforeMark}${shellAfter}`,
                    ),
                  );
                  if (afterMark) {
                    safeEnqueue(encodeForWebStream(afterMark));
                  }
                  flushPendingScripts();
                }
              } else {
                safeEnqueue(value);
              }

              if (!isClosed) await push();
            } catch (error) {
              await cancelReader(error);
            }
          }
          const pumping = push();
          options.work?.track(pumping);
          void pumping.catch(error => {
            void cancelReader(error).catch(() => {});
          });
        },
        cancel(reason) {
          return cancelReader(reason);
        },
      });
      return stream;
    } catch (e) {
      request.signal.throwIfAborted();
      // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
      const fallbackHtml = `${shellBefore}${shellAfter}`;
      const stream = getReadableStreamFromString(fallbackHtml);
      return stream;
    }
  };
