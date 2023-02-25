import { Transform, Writable } from 'stream';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { RenderLevel, RuntimeContext } from '../types';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { getTemplates } from './template';

export type Pipe<T extends Writable> = (output: T) => Promise<T | string>;

enum ShellChunkStatus {
  IDLE = 0,
  START = 1,
  FINIESH = 2,
}

function renderToPipe(
  rootElement: React.ReactElement,
  context: RuntimeContext,
  options?: RenderToPipeableStreamOptions,
) {
  let shellChunkStatus = ShellChunkStatus.IDLE;

  const { ssrContext } = context;
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
                  let concatedChunk = chunk.toString();
                  if (shellChunkStatus === ShellChunkStatus.IDLE) {
                    concatedChunk = `${shellBefore}${concatedChunk}`;
                    shellChunkStatus = ShellChunkStatus.START;
                  }
                  /**
                   * The shell content of App may be splitted by multiple chunks to transform,
                   * when any node value's size is larger than the React limitation, refer to:
                   * https://github.com/facebook/react/blob/v18.2.0/packages/react-server/src/ReactServerStreamConfigNode.js#L53.
                   * So we use the `SHELL_STREAM_END_MARK` to mark the shell content' tail.
                   */
                  if (
                    shellChunkStatus === ShellChunkStatus.START &&
                    concatedChunk.endsWith(ESCAPED_SHELL_STREAM_END_MARK)
                  ) {
                    concatedChunk = concatedChunk.replace(
                      ESCAPED_SHELL_STREAM_END_MARK,
                      shellAfter,
                    );
                    shellChunkStatus = ShellChunkStatus.FINIESH;
                  }
                  this.push(concatedChunk);
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
