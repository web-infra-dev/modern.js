import type { Writable } from 'stream';
import type {
  ReactDOMServerReadableStream,
  RenderToReadableStreamOptions,
} from 'react-dom/server';
import { RenderLevel, SSRPluginConfig } from '../types';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { SSRErrors } from '../tracker';
import { getTemplates } from './template';

export type Pipe<T extends Writable> = (output: T) => Promise<T | string>;

enum ShellChunkStatus {
  START = 0,
  FINIESH = 1,
}

function renderToPipe(
  rootElement: React.ReactElement,
  context: any,
  pluginConfig: SSRPluginConfig,
  options?: RenderToReadableStreamOptions & {
    onShellReady?: () => void;
    onAllReady?: () => void;
    onShellError?: (e: unknown) => void;
  },
) {
  let shellChunkStatus = ShellChunkStatus.START;
  const chunkVec: string[] = [];

  const { ssrContext } = context;
  const forUserPipe = async () => {
    let renderToReadableStream;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ renderToReadableStream } = require('react-dom/server'));
    } catch (e) {}

    const { shellAfter, shellBefore } = await getTemplates(
      context,
      RenderLevel.SERVER_RENDER,
      pluginConfig,
    );
    try {
      const readableOriginal: ReactDOMServerReadableStream =
        await renderToReadableStream(rootElement, {
          ...options,
          nonce: ssrContext?.nonce,
          onError(error: unknown) {
            options?.onError?.(error);
          },
        });

      // If rendering the shell is successful, that Promise will resolve.
      options?.onShellReady?.();

      // A Promise that resolves when all rendering is complete
      // call onAllready, when allReady is resolve.
      readableOriginal.allReady.then(() => {
        options?.onAllReady?.();
      });

      if (context.ssrContext?.isSpider) {
        // However, when a crawler visits your page, or if you’re generating the pages at the build time,
        // you might want to let all of the content load first and then produce the final HTML output instead of revealing it progressively.
        // from: https://react.dev/reference/react-dom/server/renderToReadableStream#handling-different-errors-in-different-ways
        await readableOriginal.allReady;
      }
      const reader: ReadableStreamDefaultReader = readableOriginal.getReader();

      const injectableStream = new ReadableStream({
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
      return injectableStream;
    } catch (err) {
      // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
      ssrContext?.tracker.trackError(SSRErrors.RENDER_SHELL, err as Error);
      const { shellAfter, shellBefore } = await getTemplates(
        context,
        RenderLevel.CLIENT_RENDER,
        pluginConfig,
      );
      const fallbackHtml = `${shellBefore}${shellAfter}`;
      return fallbackHtml;
    }
  };

  return forUserPipe();
}

let encoder: TextEncoder;
function encodeForWebStream(thing: unknown) {
  if (!encoder) {
    encoder = new TextEncoder();
  }
  if (typeof thing === 'string') {
    return encoder.encode(thing);
  }
  return thing;
}

export default renderToPipe;
