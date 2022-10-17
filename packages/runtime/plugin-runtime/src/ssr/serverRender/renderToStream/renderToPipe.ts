import { Transform, Writable } from 'stream';
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from 'react-dom/server';
import { InjectTemplate } from './type';

export type Pipe<T extends Writable> = (output: T) => Promise<T>;

function renderToPipe(
  rootElement: React.ReactElement,
  getTemplates: () => InjectTemplate,
  options?: RenderToPipeableStreamOptions,
) {
  let isShellStream = true;

  // TODO: react18 Streaming SSR

  const forUserPipe: Pipe<Writable> = stream => {
    return new Promise(resolve => {
      const { pipe } = renderToPipeableStream(rootElement, {
        ...options,
        onShellReady() {
          options?.onShellReady?.();

          const { shellAfter, shellBefore } = getTemplates();
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
