import { run } from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { parseHeaders } from '@modern-js/runtime-utils/universal/request';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type React from 'react';
import type { RuntimeContext } from '../../context';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import type { HandleRequestConfig } from '../requestHandler';
import type { RenderStreaming, SSRConfig } from '../shared';
import {
  SSRErrors,
  SSRTimings,
  createOnError,
  createOnTiming,
} from '../tracer';
import { getSSRConfigByEntry } from '../utils';

export type CreateReadableStreamFromElementOptions = {
  runtimeContext: RuntimeContext;
  config: HandleRequestConfig;
  ssrConfig: SSRConfig;
  htmlTemplate: string;
  entryName: string;

  rscClientManifest?: RscClientManifest;
  rscSSRManifest?: RscSSRManifest;
  rscServerManifest?: RscServerManifest;
  rscRoot?: React.ReactElement;
  onShellReady?: () => void;
  onShellError?: (error: unknown) => void;
  onAllReady?: () => void;
  onError?: (error: unknown) => void;
};

export type CreateReadableStreamFromElement = (
  request: Request,
  rootElement: React.ReactElement,
  options: CreateReadableStreamFromElementOptions,
) => Promise<ReadableStream<Uint8Array>>;

export enum ShellChunkStatus {
  START = 0,
  FINISH = 1,
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
  createReadableStreamPromise: Promise<CreateReadableStreamFromElement>,
): RenderStreaming {
  return async (request, serverRoot, options) => {
    const createReadableStreamFromElement = await createReadableStreamPromise;
    const headersData = parseHeaders(request);

    return run(headersData, async () => {
      const end = time();
      const { runtimeContext, config, resource } = options;

      const onError = createOnError(options.onError);
      const onTiming = createOnTiming(options.onTiming);

      const { htmlTemplate, entryName } = resource;

      const ssrConfig = getSSRConfigByEntry(
        entryName,
        config.ssr,
        config.ssrByEntries,
      );

      const RSCServerRoot = ({ children }: { children: React.ReactNode }) => {
        return <>{children}</>;
      };

      let rootElement = wrapRuntimeContextProvider(
        serverRoot,
        Object.assign(runtimeContext, { ssr: true }),
      );

      rootElement = <RSCServerRoot>{rootElement}</RSCServerRoot>;

      const stream = await createReadableStreamFromElement(
        request,
        rootElement,
        {
          config,
          htmlTemplate,
          runtimeContext,
          ssrConfig,
          entryName,
          rscClientManifest: options.rscClientManifest,
          rscSSRManifest: options.rscSSRManifest,
          rscServerManifest: options.rscServerManifest,
          rscRoot: options.rscRoot,
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
