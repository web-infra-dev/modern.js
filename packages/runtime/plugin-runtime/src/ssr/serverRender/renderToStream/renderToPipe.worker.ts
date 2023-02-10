import type { Writable } from 'stream';
import type { RenderToReadableStreamOptions } from 'react-dom/server';
import { RenderLevel, RuntimeContext } from '../types';
import { getTemplates } from './template';

export type Pipe<T extends Writable> = (output: T) => Promise<T | string>;

function renderToPipe(
  rootElement: React.ReactElement,
  context: RuntimeContext,
  options?: RenderToReadableStreamOptions,
) {
  let isShellStream = true;
  const { ssrContext } = context;
  const forUserPipe: Pipe<Writable> = async stream => {
    let renderToReadableStream;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ renderToReadableStream } = require('react-dom/server'));
    } catch (e) {}
    const { shellAfter, shellBefore } = getTemplates(
      context,
      RenderLevel.SERVER_RENDER,
    );
    try {
      const readableOriginal = await renderToReadableStream(rootElement, {
        ...options,
        onError(error: unknown) {
          ssrContext!.logger.error(
            'An error occurs during streaming SSR',
            error as Error,
          );
          ssrContext!.metrics.emitCounter('app.render.streaming.error', 1);
          options?.onError?.(error);
        },
      });
      const reader: ReadableStreamDefaultReader = readableOriginal.getReader();
      const injectableStream = new ReadableStream({
        async start(controller) {
          const { value } = await reader.read();
          if (isShellStream) {
            controller.enqueue(encodeForWebStream(shellBefore));
            controller.enqueue(value);
            controller.enqueue(encodeForWebStream(shellAfter));
            isShellStream = false;
          } else {
            controller.enqueue(value);
          }
        },
      });
      return readableOriginal(injectableStream).readableOriginal(stream);
    } catch (err) {
      // Don't log error in `onShellError` callback, since it has been logged in `onError` callback
      ssrContext!.metrics.emitCounter('app.render.streaming.shell.error', 1);
      const { shellAfter, shellBefore } = getTemplates(
        context,
        RenderLevel.CLIENT_RENDER,
      );
      const fallbackHtml = `${shellBefore}${shellAfter}`;
      return fallbackHtml;
    }
  };

  return forUserPipe;
}

let encoder: TextEncoder;
function encodeForWebStream(thing: unknown) {
  if (!encoder) {
    encoder = new TextEncoder();
  }
  if (typeof thing === 'string') {
    return encoder.encode(thing);
  }
  return thing;
}

export default renderToPipe;
