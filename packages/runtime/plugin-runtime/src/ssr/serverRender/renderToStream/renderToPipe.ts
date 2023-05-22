import { Transform, Writable } from 'stream';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { RenderLevel, RuntimeContext } from '../types';
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
  options?: RenderToPipeableStreamOptions,
) {
  let shellChunkStatus = ShellChunkStatus.START;

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
        onShellReady() {
          const { shellAfter, shellBefore } = getTemplates(
            context,
            RenderLevel.SERVER_RENDER,
          );
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
                  if (concatedChunk.endsWith(ESCAPED_SHELL_STREAM_END_MARK)) {
                    concatedChunk = concatedChunk.replace(
                      ESCAPED_SHELL_STREAM_END_MARK,
                      '',
                    );

                    shellChunkStatus = ShellChunkStatus.FINIESH;
                    this.push(`${shellBefore}${concatedChunk}${shellAfter}`);
                  }
                } else {
                  this.push(chunk);
                }
                callback();
              } catch (e) {
                if (e instanceof Error) {
                  callback(e);
                } else {
                  callback(new Error('Received unkown error when streaming'));
                }
              }
            },
          });

          resolve(pipe(injectableTransform).pipe(stream));
        },
        onShellError(error: unknown) {
          // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
          ssrContext!.metrics.emitCounter(
            'app.render.streaming.shell.error',
            1,
          );
          const { shellAfter, shellBefore } = getTemplates(
            context,
            RenderLevel.CLIENT_RENDER,
          );
          const fallbackHtml = `${shellBefore}${shellAfter}`;
          resolve(fallbackHtml);
          options?.onShellError?.(error);
        },
        onError(error: unknown) {
          ssrContext!.logger.error(
            'An error occurs during streaming SSR',
            error as Error,
          );
          ssrContext!.metrics.emitCounter('app.render.streaming.error', 1);
          options?.onError?.(error);
        },
      });
    });
  };

  return forUserPipe;
}

export default renderToPipe;
