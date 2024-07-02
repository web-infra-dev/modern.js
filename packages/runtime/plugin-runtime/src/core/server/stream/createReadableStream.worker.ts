import { renderToReadableStream } from 'react-dom/server';
import { isbot as checkIsBot } from 'isbot';
import { RenderLevel } from '../../constants';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import {
  CreateReadableStreamFromElement,
  ShellChunkStatus,
  encodeForWebStream,
  getReadableStreamFromString,
} from './shared';
import { getTemplates } from './template';

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    let shellChunkStatus = ShellChunkStatus.START;
    const chunkVec: string[] = [];

    const { htmlTemplate, runtimeContext, config, ssrConfig } = options;

    const { shellBefore, shellAfter } = await getTemplates(htmlTemplate, {
      renderLevel: RenderLevel.SERVER_RENDER,
      runtimeContext,
      ssrConfig,
      request,
      config,
    });

    try {
      const readableOriginal = await renderToReadableStream(rootElement, {
        nonce: config.nonce,
        onError(error) {
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
          async function push() {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            if (shellChunkStatus !== ShellChunkStatus.FINIESH) {
              const chunk = new TextDecoder().decode(value);

              chunkVec.push(chunk);

              let concatedChunk = chunkVec.join('');
              if (concatedChunk.endsWith(ESCAPED_SHELL_STREAM_END_MARK)) {
                concatedChunk = concatedChunk.replace(
                  ESCAPED_SHELL_STREAM_END_MARK,
                  '',
                );

                shellChunkStatus = ShellChunkStatus.FINIESH;

                controller.enqueue(
                  encodeForWebStream(
                    `${shellBefore}${concatedChunk}${shellAfter}`,
                  ),
                );
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
