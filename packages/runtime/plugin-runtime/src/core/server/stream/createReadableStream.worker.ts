import { renderSSRStream } from '@modern-js/render/ssr';
import { storage } from '@modern-js/runtime-utils/node';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { enqueueFromEntries } from './deferredScript';
import { DeferredScriptOutputCoordinator } from './deferredScriptOutputCoordinator';
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
      readableOriginal.allReady.then(() => {
        options?.onAllReady?.();
      });

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
      let coordinator: DeferredScriptOutputCoordinator | undefined;

      const stream = new ReadableStream({
        start(controller) {
          const decoder = new TextDecoder();
          const pendingScripts: string[] = [];
          let isClosed = false;
          let deferredResolversComplete = Promise.resolve();

          const safeEnqueue = (chunk: Uint8Array | unknown) => {
            if (isClosed) return;
            try {
              controller.enqueue(chunk as Uint8Array);
            } catch {
              isClosed = true;
            }
          };

          const closeController = () => {
            if (!isClosed) {
              isClosed = true;
              try {
                controller.close();
              } catch {
                // Controller already closed
              }
            }
          };

          coordinator = new DeferredScriptOutputCoordinator(content => {
            safeEnqueue(encodeForWebStream(content));
          });

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

          if (entries.length > 0) {
            deferredResolversComplete = enqueueFromEntries(
              entries,
              config.nonce,
              script => {
                if (!coordinator) {
                  throw new Error('Deferred script coordinator is not ready');
                }
                if (shellChunkStatus === ShellChunkStatus.FINISH) {
                  coordinator.enqueueResolver(script);
                } else {
                  pendingScripts.push(script);
                }
              },
            );
          }

          async function push() {
            try {
              const { done, value } = await reader.read();
              if (done) {
                const trailingText = decoder.decode();
                if (trailingText) {
                  coordinator?.writeReact(trailingText);
                }
                await deferredResolversComplete;
                coordinator?.finish();
                closeController();
                return;
              }

              if (isClosed) return;

              if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                chunkVec.push(decoder.decode(value, { stream: true }));
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
                  coordinator?.writeReact(
                    `${shellBefore}${beforeMark}${shellAfter}`,
                  );
                  if (afterMark) {
                    coordinator?.writeReact(afterMark);
                  }
                  coordinator?.markShellFinished();
                  for (const script of pendingScripts) {
                    coordinator?.enqueueResolver(script);
                  }
                  pendingScripts.length = 0;
                }
              } else {
                const decodedChunk = decoder.decode(value, { stream: true });
                if (decodedChunk) {
                  coordinator?.writeReact(decodedChunk);
                }
              }

              if (!isClosed) push();
            } catch (error) {
              coordinator?.abort();
              if (!isClosed) {
                isClosed = true;
                try {
                  controller.error(error);
                } catch {
                  // Controller already closed
                }
              }
            }
          }
          push();
        },
        cancel(reason) {
          coordinator?.abort();
          reader.cancel(reason).catch(() => {
            // Ignore cancellation errors
          });
        },
      });
      return stream;
    } catch (e) {
      // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
      const fallbackHtml = `${shellBefore}${shellAfter}`;
      const stream = getReadableStreamFromString(fallbackHtml);
      return stream;
    }
  };
