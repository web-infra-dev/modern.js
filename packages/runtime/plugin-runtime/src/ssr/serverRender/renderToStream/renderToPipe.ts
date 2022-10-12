import { Transform, Writable } from 'stream';
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from 'react-dom/server';
import { InjectTemplate } from './type';

export type Pipe<T extends Writable> = (output: T) => Promise<T>;

enum StreamingStatus {
  Entry,
  Streaming,
  Leave,
}

function renderToPipe(
  rootElement: React.ReactElement,
  getTemplates: () => InjectTemplate,
  options?: RenderToPipeableStreamOptions,
) {
  let streamingStaus = StreamingStatus.Entry;

  // TODO: react18 Streaming SSR

  const forUserPipe: Pipe<Writable> = stream => {
    return new Promise(resolve => {
      const { pipe } = renderToPipeableStream(rootElement, {
        ...options,
        onAllReady() {
          options?.onAllReady?.();

          const { beforeEntry, afterEntry, beforeEach, afterEach } =
            getTemplates();
          const injectableTransform = new Transform({
            transform(chunk, _encoding, callback) {
              try {
                switch (streamingStaus) {
                  case StreamingStatus.Entry: {
                    this.push(joinChunk(beforeEntry, chunk, afterEntry));
                    streamingStaus = StreamingStatus.Streaming;
                    break;
                  }
                  case StreamingStatus.Streaming: {
                    this.push(chunk.toString());
                    break;
                  }
                  case StreamingStatus.Leave: {
                    this.push(joinChunk(beforeEach, chunk, afterEach));
                    break;
                  }
                  default: {
                    this.push(chunk);
                  }
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
