/**
 * forked and modified from https://github.com/devongovett/rsc-html-stream/blob/main/client.js
 * license at https://github.com/devongovett/rsc-html-stream/blob/main/LICENSE
 */

const encoder = new TextEncoder();
let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

export const rscStream = new ReadableStream<Uint8Array>({
  start(controller) {
    if (typeof window === 'undefined') {
      return;
    }

    const handleChunk = (chunk: string | Uint8Array) => {
      if (typeof chunk === 'string') {
        controller.enqueue(encoder.encode(chunk));
      } else {
        controller.enqueue(chunk);
      }
    };

    (window as any).__FLIGHT_DATA = (window as any).__FLIGHT_DATA || [];

    ((window as any).__FLIGHT_DATA as (string | Uint8Array)[]).forEach(
      handleChunk,
    );

    (window as any).__FLIGHT_DATA.push = (chunk: string | Uint8Array) => {
      handleChunk(chunk);
    };

    streamController = controller;
  },
});

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    streamController?.close();
  });
} else {
  streamController?.close();
}
