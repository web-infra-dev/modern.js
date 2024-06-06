/* eslint-disable node/prefer-global/buffer */
/**
 * The following code is modified based on
 * https://github.com/remix-run/remix/blob/f7defe0b46c50947f6269d5ab5b6e3fe59339054/packages/remix-node/stream.ts#L3
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright 2021 Remix Software Inc.
 * https://github.com/remix-run/remix/blob/f7defe0b46c50947f6269d5ab5b6e3fe59339054/LICENSE.md
 */
import type { Readable, Writable } from 'node:stream';
import { Stream } from 'node:stream';

export async function writeReadableStreamToWritable(
  stream: ReadableStream,
  writable: Writable,
) {
  const reader = stream.getReader();
  // eslint-disable-next-line @typescript-eslint/ban-types
  const flushable = writable as { flush?: Function };

  try {
    await new Promise<void>((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);

      const writeAndFlush = async () => {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            writable.end();
            break;
          }

          writable.write(value);
          if (typeof flushable.flush === 'function') {
            flushable.flush();
          }
        }
      };

      writeAndFlush().catch(reject);
    });
  } catch (error) {
    writable.destroy(error as Error);
    throw error;
  }
}

export async function writeAsyncIterableToWritable(
  iterable: AsyncIterable<Uint8Array>,
  writable: Writable,
) {
  try {
    for await (const chunk of iterable) {
      writable.write(chunk);
    }
    writable.end();
  } catch (error: any) {
    writable.destroy(error);
    throw error;
  }
}

export async function readableStreamToString(
  stream: ReadableStream<Uint8Array>,
  encoding?: BufferEncoding,
) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks).toString(encoding);
}

export const createReadableStreamFromReadable = (
  source: Readable & { readableHighWaterMark?: number },
) => {
  const pump = new StreamPump(source);
  const stream = new ReadableStream(pump, pump);
  return stream;
};

class StreamPump {
  public highWaterMark: number;

  public accumalatedSize: number;

  private stream: Stream & {
    readableHighWaterMark?: number;
    readable?: boolean;
    resume?: () => void;
    pause?: () => void;
    destroy?: (error?: Error) => void;
  };

  private controller?: ReadableStreamController<Uint8Array>;

  constructor(
    stream: Stream & {
      readableHighWaterMark?: number;
      readable?: boolean;
      resume?: () => void;
      pause?: () => void;
      destroy?: (error?: Error) => void;
    },
  ) {
    this.highWaterMark =
      stream.readableHighWaterMark ||
      new Stream.Readable().readableHighWaterMark;
    this.accumalatedSize = 0;
    this.stream = stream;
    this.enqueue = this.enqueue.bind(this);
    this.error = this.error.bind(this);
    this.close = this.close.bind(this);
  }

  size(chunk: Uint8Array) {
    return chunk?.byteLength || 0;
  }

  start(controller: ReadableStreamController<Uint8Array>) {
    this.controller = controller;
    this.stream.on('data', this.enqueue);
    this.stream.once('error', this.error);
    this.stream.once('end', this.close);
    this.stream.once('close', this.close);
  }

  pull() {
    this.resume();
  }

  cancel(reason?: Error) {
    if (this.stream.destroy) {
      this.stream.destroy(reason);
    }

    this.stream.off('data', this.enqueue);
    this.stream.off('error', this.error);
    this.stream.off('end', this.close);
    this.stream.off('close', this.close);
  }

  enqueue(chunk: Uint8Array | string) {
    if (this.controller) {
      try {
        const bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);

        const available = (this.controller.desiredSize || 0) - bytes.byteLength;

        // FIXME: @modern-js/devtools-client would compiled failed.
        (this.controller as any).enqueue(bytes);

        if (available <= 0) {
          this.pause();
        }
      } catch (error: any) {
        this.controller.error(
          new Error(
            'Could not create Buffer, chunk must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object',
          ),
        );
        this.cancel();
      }
    }
  }

  pause() {
    if (this.stream.pause) {
      this.stream.pause();
    }
  }

  resume() {
    if (this.stream.readable && this.stream.resume) {
      this.stream.resume();
    }
  }

  close() {
    if (this.controller) {
      this.controller.close();
      delete this.controller;
    }
  }

  error(error: Error) {
    if (this.controller) {
      this.controller.error(error);
      delete this.controller;
    }
  }
}
