import type { OnError } from '@modern-js/app-tools';
import { time } from '@modern-js/runtime-utils/time';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type React from 'react';
import type { TRuntimeContext } from '../../context';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import type { HandleRequestConfig } from '../requestHandler';
import type { RenderStreaming, SSRConfig } from '../shared';
import { SSRErrors, SSRTimings } from '../tracer';
import { getSSRConfigByEntry } from '../utils';

export type CreateReadableStreamFromElementOptions = {
  runtimeContext: TRuntimeContext;
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
  onError: OnError;
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

    const end = time();
    const { runtimeContext, config, resource } = options;
    const { onError, onTiming } = options;

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

    const stream = await createReadableStreamFromElement(request, rootElement, {
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
        onError(error, SSRErrors.RENDER_SHELL);
      },
      onError(error) {
        onError(error, SSRErrors.RENDER_STREAM);
      },
    });

    return stream;
  };
}
