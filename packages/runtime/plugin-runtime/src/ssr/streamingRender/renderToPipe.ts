import { Transform } from 'stream';
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from 'react-dom/server';
import { InjectTemplate } from './type';

export type RenderToPipeOptioons = Omit<
  RenderToPipeableStreamOptions,
  'onShellReady' | 'onShellError' | 'onAllReady' | 'onError'
>;

enum StreamingStatus {
  Entry,
  Streaming,
  Leave,
}

function renderToPipe(
  App: React.ComponentType<any>,
  injectTemplate: InjectTemplate,
  options?: RenderToPipeOptioons,
) {
  let streamingStaus = StreamingStatus.Entry;
  const transformPipe = new Transform({
    transform(chunk, _encoding, callback) {
      try {
        switch (streamingStaus) {
          case StreamingStatus.Entry: {
            this.push(
              joinChunk(
                injectTemplate.beforeEntry,
                chunk,
                injectTemplate.afterEntry,
              ),
            );
            streamingStaus = StreamingStatus.Streaming;
            break;
          }
          case StreamingStatus.Streaming: {
            this.push(chunk.toString());
            break;
          }
          case StreamingStatus.Leave: {
            this.push(
              joinChunk(
                injectTemplate.beforeEach,
                chunk,
                injectTemplate.afterEach,
              ),
            );
            break;
          }
          default:
        }
        callback();
      } catch (e) {
        if (e instanceof Error) {
          callback(e);
        } else {
          callback(new Error('unkown error'));
        }
      }
    },
  });
  // TODO: react18 Streaming SSR
  // const rawStream = renderToPipeableStream(App, {
  //   onShellReady() {
  //     rawStream.pipe(transformPipe);
  //   },
  //   onAllReady() {
  //     streamingStaus = StreamingStatus.Leave;
  //     const readableStream = new Readable({
  //       read(_) {
  //         this.push(injectTemplate.afterLeave);
  //         this.push(null);
  //       },
  //     });
  //     readableStream.pipe(transformPipe);
  //   },
  //   ...options,
  // });
  const rawStream = renderToPipeableStream(App, {
    onAllReady() {
      rawStream.pipe(transformPipe);
    },
    ...options,
  });

  return {
    pipe: transformPipe.pipe,
    abort: rawStream.abort,
  };

  function joinChunk<Chunk extends { toString: () => string }>(
    before = '',
    chunk: Chunk,
    after = '',
  ) {
    return `${before}${chunk.toString()}${after}`;
  }
}

export default renderToPipe;
