import { time } from '@modern-js/runtime-utils/time';
import { parseHeaders } from '@modern-js/runtime-utils/universal';
import { createElement } from 'react';
import { run } from '@modern-js/runtime-utils/node';

import { RuntimeContext } from '../../context';
import { HandleRequestConfig } from '../requestHandler';
import { RenderStreaming } from '../shared';
import {
  SSRErrors,
  SSRTimings,
  createOnError,
  createOnTiming,
} from '../tracer';

export type CreateReadableStreamFromElementOptions = {
  runtimeContext: RuntimeContext;
  config: HandleRequestConfig;
  htmlTemplate: string;
  onShellReady?: () => void;
  onShellError?: (error: unknown) => void;
  onAllReady?: () => void;
  onError?: (error: unknown) => void;
};

export type CreateReadableStreamFromElement = (
  request: Request,
  rootElement: React.ReactElement,
  options: CreateReadableStreamFromElementOptions,
) => Promise<ReadableStream>;

export enum ShellChunkStatus {
  START = 0,
  FINIESH = 1,
}

let encoder: TextEncoder;
export function encodeForWebStream(thing: unknown) {
  if (!encoder) {
    encoder = new TextEncoder();
  }
  if (typeof thing === 'string') {
    return encoder.encode(thing);
  }
  return thing;
}

export function getReadableStreamFromString(content: string): ReadableStream {
  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeForWebStream(content));
      controller.close();
    },
  });

  return readableStream;
}

export function createRenderStreaming(
  createReadableStreamFromElement: CreateReadableStreamFromElement,
): RenderStreaming {
  return async (request, serverRoot, options) => {
    const headersData = parseHeaders(request);

    return run(headersData, async () => {
      const end = time();
      const { runtimeContext, config, resource } = options;

      const onError = createOnError(options.onError);
      const onTiming = createOnTiming(options.onTiming);

      const { htmlTemplate } = resource;

      const rootElement = createElement(serverRoot, {
        context: Object.assign(runtimeContext || {}, {
          ssr: true,
        }),
      });

      const stream = await createReadableStreamFromElement(
        request,
        rootElement,
        {
          config,
          htmlTemplate,
          runtimeContext,
          onShellReady() {
            const cost = end();
            onTiming(SSRTimings.RENDER_SHELL, cost);
          },
          onAllReady() {
            const cost = end();
            onTiming(SSRTimings.RENDER_HTML, cost);
          },
          onShellError(error) {
            onError(SSRErrors.RENDER_SHELL, error);
          },
          onError(error) {
            onError(SSRErrors.RENDER_STREAM, error);
          },
        },
      );

      return stream;
    });
  };
}
