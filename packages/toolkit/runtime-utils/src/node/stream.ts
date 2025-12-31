import { nextTick } from 'node:process';
import { type Readable, Stream } from 'node:stream';

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

    nextTick(() => {
      this.stream.off('data', this.enqueue);
      this.stream.off('error', this.error);
      this.stream.off('end', this.close);
      this.stream.off('close', this.close);
    });
  }

  enqueue(chunk: Uint8Array | string) {
    if (this.controller) {
      try {
        const bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);

        const available = (this.controller.desiredSize || 0) - bytes.byteLength;
        this.controller.enqueue(
          bytes as unknown as ArrayBufferView<ArrayBuffer> &
            Uint8Array<ArrayBufferLike>,
        );
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
