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
  getTemplates: () => InjectTemplate,
  options?: RenderToPipeOptioons,
) {
  let streamingStaus = StreamingStatus.Entry;

  // TODO: react18 Streaming SSR

  const forUserPipe: Pipe = outputStream => {
    const rawStream = renderToPipeableStream(rootElement, {
      onAllReady() {
        const { beforeEntry, afterEntry, beforeEach, afterEach } =
          getTemplates();
        const transformStream = new Transform({
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
