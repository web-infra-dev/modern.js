import { Transform, Writable } from 'stream';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { RenderLevel, RuntimeContext, SSRPluginConfig } from '../types';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { getTemplates } from './template';

export type Pipe<T extends Writable> = (output: T) => Promise<T | string>;

enum ShellChunkStatus {
  START = 0,
  FINIESH = 1,
}

function renderToPipe(
  rootElement: React.ReactElement,
  context: RuntimeContext,
  pluginConfig: SSRPluginConfig,
  options?: RenderToPipeableStreamOptions,
) {
  let shellChunkStatus = ShellChunkStatus.START;

  // When a crawler visit the page, we should waiting for entrie content of page
  const onReady = context.ssrContext?.isSpider ? 'onAllReady' : 'onShellReady';

  const { ssrContext } = context;
  const chunkVec: string[] = [];
  const forUserPipe: Pipe<Writable> = stream => {
    return new Promise(resolve => {
      let renderToPipeableStream;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        ({ renderToPipeableStream } = require('react-dom/server'));
      } catch (e) {}

      const { pipe } = renderToPipeableStream(rootElement, {
        ...options,
        nonce: ssrContext?.nonce,
        [onReady]() {
          getTemplates(context, RenderLevel.SERVER_RENDER, pluginConfig).then(
            ({ shellAfter, shellBefore }) => {
              options?.onShellReady?.();
              const injectableTransform = new Transform({
                transform(chunk, _encoding, callback) {
                  try {
                    if (shellChunkStatus !== ShellChunkStatus.FINIESH) {
                      chunkVec.push(chunk.toString());

                      /**
                       * The shell content of App may be splitted by multiple chunks to transform,
                       * when any node value's size is larger than the React limitation, refer to:
                       * https://github.com/facebook/react/blob/v18.2.0/packages/react-server/src/ReactServerStreamConfigNode.js#L53.
                       * So we use the `SHELL_STREAM_END_MARK` to mark the shell content' tail.
                       */
                      let concatedChunk = chunkVec.join('');
                      if (
                        concatedChunk.endsWith(ESCAPED_SHELL_STREAM_END_MARK)
                      ) {
                        concatedChunk = concatedChunk.replace(
                          ESCAPED_SHELL_STREAM_END_MARK,
                          '',
                        );

                        shellChunkStatus = ShellChunkStatus.FINIESH;
                        this.push(
                          `${shellBefore}${concatedChunk}${shellAfter}`,
                        );
                      }
                    } else {
                      this.push(chunk);
                    }
                    callback();
                  } catch (e) {
                    if (e instanceof Error) {
                      callback(e);
                    } else {
                      callback(
                        new Error('Received unkown error when streaming'),
                      );
                    }
                  }
                },
              });

              resolve(pipe(injectableTransform).pipe(stream));
            },
          );
        },
        onShellError(error: unknown) {
          // eslint-disable-next-line promise/no-promise-in-callback
          getTemplates(context, RenderLevel.CLIENT_RENDER, pluginConfig).then(
            ({ shellAfter, shellBefore }) => {
              const fallbackHtml = `${shellBefore}${shellAfter}`;
              resolve(fallbackHtml);
              options?.onShellError?.(error);
            },
          );
        },
      });
    });
  };

  return forUserPipe;
}

export default renderToPipe;
