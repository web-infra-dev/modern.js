import type { OnError } from '@modern-js/app-tools';
import { time } from '@modern-js/runtime-utils/time';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import checkIsBot from 'isbot';
import type React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { JSX_SHELL_STREAM_END_MARK } from '../../../common';
import type { RuntimeContext } from '../../context';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import type { HandleRequestConfig } from '../requestHandler';
import type { RenderStreaming, SSRConfig } from '../shared';
import { SSRErrors, SSRTimings } from '../tracer';
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
  onError: OnError;
  helmetContext?: Record<string, unknown>;
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

const SHOULD_STREAM_ALL_HEADER = 'x-should-stream-all';

function parseShouldStreamAllFlag(value: string | null): boolean | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();

  // if the header is set to 'false', treat it as false, runtime will not stream all.
  // Otherwise, treat it as true.
  if (normalized === 'false') {
    return false;
  }
  return true;
}

export function resolveStreamingMode(
  request: Request,
  forceStreamToString: boolean,
): {
  onReady: 'onAllReady' | 'onShellReady';
  waitForAllReady: boolean;
} {
  const shouldStreamAll = parseShouldStreamAllFlag(
    request.headers.get(SHOULD_STREAM_ALL_HEADER),
  );

  const isBot = checkIsBot(request.headers.get('user-agent'));

  if (shouldStreamAll) {
    return { onReady: 'onAllReady', waitForAllReady: true };
  }

  if (forceStreamToString) {
    return { onReady: 'onAllReady', waitForAllReady: true };
  }

  if (isBot) {
    return { onReady: 'onAllReady', waitForAllReady: true };
  }

  return { onReady: 'onShellReady', waitForAllReady: false };
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

    const StreamServerRootWrapper = ({
      children,
    }: { children: React.ReactNode }) => {
      return (
        <>
          {children}
          {JSX_SHELL_STREAM_END_MARK}
        </>
      );
    };

    // Create request-level Helmet context for react-helmet-async
    const helmetContext = {};

    let rootElement = wrapRuntimeContextProvider(
      serverRoot,
      Object.assign(runtimeContext, { ssr: true }),
    );

    rootElement = (
      <HelmetProvider context={helmetContext}>
        <StreamServerRootWrapper>{rootElement}</StreamServerRootWrapper>
      </HelmetProvider>
    );

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
      helmetContext,
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
