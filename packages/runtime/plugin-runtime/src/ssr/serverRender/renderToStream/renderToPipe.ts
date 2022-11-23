import { Transform, Writable } from 'stream';
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from 'react-dom/server';
import { RenderLevel, RuntimeContext } from '../types';
import { getTemplates } from './template';

export type Pipe<T extends Writable> = (output: T) => Promise<T | string>;

function renderToPipe(
  rootElement: React.ReactElement,
  context: RuntimeContext,
  options?: RenderToPipeableStreamOptions,
) {
  let isShellStream = true;
  const { ssrContext } = context;
  const forUserPipe: Pipe<Writable> = stream => {
    return new Promise(resolve => {
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
                if (isShellStream) {
                  this.push(joinChunk(shellBefore, chunk, shellAfter));
                  isShellStream = false;
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
        onShellError(error) {
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
        onError(error) {
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

  function joinChunk<Chunk extends { toString: () => string }>(
    before = '',
    chunk: Chunk,
    after = '',
  ) {
    return `${before}${chunk.toString()}${after}`;
  }
}

export default renderToPipe;
