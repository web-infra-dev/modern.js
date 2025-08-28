import { renderSSRStream } from '@modern-js/render/ssr';
import { storage } from '@modern-js/runtime-utils/node';
import checkIsBot from 'isbot';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { enqueueFromEntries } from './deferredScript';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  encodeForWebStream,
  getReadableStreamFromString,
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
        clientManifest: options.rscClientManifest,
        ssrManifest: options.rscSSRManifest,
        nonce: config.nonce,
        rscRoot,
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

      const isbot = checkIsBot(request.headers.get('user-agent'));
      if (isbot) {
        // However, when a crawler visits your page, or if you’re generating the pages at the build time,
        // you might want to let all of the content load first and then produce the final HTML output instead of revealing it progressively.
        // from: https://react.dev/reference/react-dom/server/renderToReadableStream#handling-different-errors-in-different-ways
        await readableOriginal.allReady;
      }

      const reader = readableOriginal.getReader();

      const stream = new ReadableStream({
        start(controller) {
          const pendingScripts: string[] = [];
          const enqueueScript = (script: string) => {
            if (shellChunkStatus === ShellChunkStatus.FINISH) {
              controller.enqueue(encodeForWebStream(script));
            } else {
              pendingScripts.push(script);
            }
          };

          const storageContext = storage.useContext?.();
          const routerContext = options.runtimeContext?.routerContext;

          /**
           * When using react-router v6, activeDeferreds is injected into routerContext by react-router.
           * When using react-router v7, activeDeferreds is injected into storageContext by @modern-js/runtime.
           * @see packages/toolkit/runtime-utils/src/browser/nestedRoutes.tsx
           */
          const entries: Array<[string, unknown]> =
            storageContext?.activeDeferreds instanceof Map &&
            storageContext.activeDeferreds?.size > 0
              ? Array.from(storageContext.activeDeferreds.entries())
              : routerContext?.activeDeferreds
                ? Object.entries(routerContext.activeDeferreds)
                : [];

          if (entries.length > 0) {
            enqueueFromEntries(entries, config.nonce, (s: string) =>
              enqueueScript(s),
            );
          }

          async function push() {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            if (shellChunkStatus !== ShellChunkStatus.FINISH) {
              const chunk = new TextDecoder().decode(value);

              chunkVec.push(chunk);

              let concatedChunk = chunkVec.join('');
              if (concatedChunk.includes(ESCAPED_SHELL_STREAM_END_MARK)) {
                concatedChunk = concatedChunk.replace(
                  ESCAPED_SHELL_STREAM_END_MARK,
                  '',
                );

                shellChunkStatus = ShellChunkStatus.FINISH;

                controller.enqueue(
                  encodeForWebStream(
                    `${shellBefore}${concatedChunk}${shellAfter}`,
                  ),
                );
                // Flush any pending <script> collected before shell finished
                if (pendingScripts.length > 0) {
                  for (const s of pendingScripts) {
                    controller.enqueue(encodeForWebStream(s));
                  }
                  pendingScripts.length = 0;
                }
              }
            } else {
              controller.enqueue(value);
            }
            push();
          }
          push();
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
