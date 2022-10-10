import { Transform, Writable } from 'stream';
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from 'react-dom/server';
import React from 'react';
import { InjectTemplate } from './type';

export type RenderToPipeOptioons = Omit<
  RenderToPipeableStreamOptions,
  'onShellReady' | 'onShellError' | 'onAllReady' | 'onError'
>;

export type Pipe = (writable: Writable) => void;

enum StreamingStatus {
  Entry,
  Streaming,
  Leave,
}

function renderToPipe(
  rootElement: React.ReactElement,
  injectTemplate: InjectTemplate,
  options?: RenderToPipeOptioons,
) {
  let streamingStaus = StreamingStatus.Entry;
  const transformStream = new Transform({
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
          callback(new Error('Received unkown error when streaming'));
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

  const forUserPipe: Pipe = outputStream => {
    const rawStream = renderToPipeableStream(rootElement, {
      onAllReady() {
        rawStream.pipe(transformStream).pipe(outputStream);
      },
      ...options,
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
