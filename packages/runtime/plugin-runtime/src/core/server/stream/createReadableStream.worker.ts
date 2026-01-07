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
        clientManifest: options.rscClientManifest!,
        ssrManifest: options.rscSSRManifest!,
        nonce: config.nonce,
        rscRoot: rscRoot!,
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

      const stream = new ReadableStream({
        start(controller) {
          const pendingScripts: string[] = [];
          let isClosed = false;

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

          const flushPendingScripts = () => {
            for (const s of pendingScripts) {
              safeEnqueue(encodeForWebStream(s));
            }
            pendingScripts.length = 0;
          };

          const enqueueScript = (script: string) => {
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

          if (entries.length > 0) {
            enqueueFromEntries(entries, config.nonce, enqueueScript);
          }

          async function push() {
            try {
              const { done, value } = await reader.read();
              if (done) {
                closeController();
                return;
              }

              if (isClosed) return;

              if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                chunkVec.push(new TextDecoder().decode(value));
                const concatedChunk = chunkVec.join('');

                if (concatedChunk.includes(ESCAPED_SHELL_STREAM_END_MARK)) {
                  shellChunkStatus = ShellChunkStatus.FINISH;
                  safeEnqueue(
                    encodeForWebStream(
                      `${shellBefore}${concatedChunk.replace(
                        ESCAPED_SHELL_STREAM_END_MARK,
                        '',
                      )}${shellAfter}`,
                    ),
                  );
                  flushPendingScripts();
                }
              } else {
                safeEnqueue(value);
              }

              if (!isClosed) push();
            } catch (error) {
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
