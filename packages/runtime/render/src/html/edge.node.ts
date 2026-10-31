import { PassThrough, Readable } from 'node:stream';
import type { ReactNode } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import type { renderToReadableStream } from 'react-dom/server';
import { renderPipeableElement } from './node';
import { renderReadableWith } from './readable';
import type { ReadableRenderOptions } from './readable';

export type { ReadableRenderOptions } from './readable';

/** Node consumption must not create the browser renderer's MessageChannel. */
export async function renderReadableElement(
  element: ReactNode,
  options: ReadableRenderOptions = {},
) {
  const render =
    ReactDOMServer.renderToReadableStream || renderPipeableReadable;
  return renderReadableWith(render, element, options);
}

// React 18 and early React 19 expose only the pipeable API in Node. Adapt that
// API here, while the Web export continues to use the real browser renderer.
const renderPipeableReadable: typeof renderToReadableStream = async (
  element,
  options = {},
) => {
  if (options.signal?.aborted) throw options.signal.reason;
  const { onHeaders, ...rest } = options;
  let ready!: () => void;
  let fail!: (error: unknown) => void;
  const allReady = new Promise<void>((resolve, reject) => {
    ready = resolve;
    fail = reject;
  });
  // A shell failure rejects the returned render promise before it exposes allReady.
  void allReady.then(
    () => undefined,
    () => undefined,
  );
  return new Promise((resolve, reject) => {
    const body = new PassThrough();
    const rendered = renderPipeableElement(element, {
      ...rest,
      onHeaders: onHeaders
        ? descriptor => {
            const headers = new Headers();
            if (descriptor.Link) headers.set('Link', descriptor.Link);
            onHeaders(headers);
          }
        : undefined,
      onShellReady() {
        const stream = Object.assign(Readable.toWeb(body), { allReady });
        resolve(stream as Awaited<ReturnType<typeof renderToReadableStream>>);
        rendered.pipe(body);
      },
      onAllReady: ready,
      onShellError(error: unknown) {
        fail(error);
        reject(error);
        body.destroy();
      },
    });
    const abort = () => rendered.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    body.once('close', () => {
      options.signal?.removeEventListener('abort', abort);
      if (!body.readableEnded) rendered.abort();
    });
    body.once('error', reject);
    if (options.signal?.aborted) abort();
  });
};
