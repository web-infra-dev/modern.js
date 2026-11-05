import { PassThrough, Readable } from 'node:stream';
import type { RequestHandlerOptions } from '@modern-js/app-tools';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server.node';
import { createScopedRoot } from '../core/react/scope.node';
import {
  createScopeRuntime,
  PreparedScopeContext,
  type ScopedRootDefinition,
} from '../core/react/scopeDefinition';
import { wrapRuntimeContextProvider } from '../core/react/wrapper';
import { createRequestHandler } from '../core/server/requestHandler';
import { serializeErrors } from '../router/runtime/utils';
import { ApplicationShell } from './ApplicationShell';
import { createApplicationData } from './data.server';
import { APPLICATION_SNAPSHOT_PROTOCOL } from './constants';
import type { ApplicationDataPatch, ApplicationSnapshot } from './types';

export type { ApplicationDataPatch, ApplicationSnapshot } from './types';

export interface RenderApplicationOptions {
  identifierPrefix: string;
  definition: ScopedRootDefinition;
  memoryRoute?: { entryPath: string };
  /** Already wrapped by Modern createRoot; do not wrap the component again. */
  element?: React.ReactElement;
  basename?: string;
  props?: Record<string, unknown>;
  nonce?: string;
  signal?: AbortSignal;
  loaderContext?: Map<string, unknown>;
  onError?: (error: unknown) => void;
}

export interface ApplicationStream {
  stream: ReadableStream<Uint8Array>;
  hydration: {
    snapshot: Promise<ApplicationSnapshot>;
    updates: ReadableStream<ApplicationDataPatch>;
    /** ID of the template that terminates the complete React shell. */
    shellMarker: string;
  };
  cancel: (reason?: unknown) => void;
}

/**
 * Render the application's existing scope using its own runtime and React renderer.
 * The caller owns framing, transport, assets, and the outer HTML document.
 */
export async function renderApplication(
  request: Request,
  options: RenderApplicationOptions,
): Promise<ApplicationStream> {
  if (!options.identifierPrefix) {
    throw new Error('renderApplication requires a unique identifierPrefix');
  }
  const signal = options.signal || request.signal;
  signal.throwIfAborted();
  if (options.memoryRoute) {
    request = new Request(
      new URL(options.memoryRoute.entryPath, request.url),
      request,
    );
  }
  if (options.signal) request = new Request(request, { signal });
  const basename = options.memoryRoute ? '/' : options.basename || '/';
  const props = options.props || {};
  let result: ApplicationStream | undefined;
  const prepared = createScopeRuntime(options.definition, {
    isBrowser: false,
    basename,
    initialUrl: request.url,
    memory: Boolean(options.memoryRoute),
    observeRouteCommits: true,
  });
  const Root = createScopedRoot(options.definition);

  const handler = await createRequestHandler(
    async (_request, Root, context) => {
      signal.throwIfAborted();
      const { runtimeContext } = context;
      runtimeContext.ssr = true;
      const shellMarker = `${options.identifierPrefix}shell`;
      const app = (
        <PreparedScopeContext.Provider value={prepared}>
          {options.element || <Root {...props} />}
        </PreparedScopeContext.Provider>
      );
      const element = wrapRuntimeContextProvider(
        <ApplicationShell marker={shellMarker}>{app}</ApplicationShell>,
        runtimeContext,
      );
      const getSnapshot = (): Omit<ApplicationSnapshot, 'pending'> => {
        const router = runtimeContext.routerContext;
        return {
          protocol: APPLICATION_SNAPSHOT_PROTOCOL,
          reactVersion: React.version,
          identifierPrefix: options.identifierPrefix,
          shellMarker,
          url: request.url,
          basename,
          ...(options.memoryRoute ? { memoryRoute: options.memoryRoute } : {}),
          props,
          initialData: runtimeContext.initialData,
          i18nData: runtimeContext.__i18nData__,
          routerData: router
            ? {
                loaderData: router.loaderData,
                errors: serializeErrors(router.errors),
              }
            : undefined,
        };
      };
      let applicationData: ReturnType<typeof createApplicationData> | undefined;
      const output = new PassThrough();
      let abortRender: (reason?: unknown) => void = () => {};
      let failed = false;
      const fail = (reason: unknown) => {
        if (failed) return;
        failed = true;
        const error =
          reason instanceof Error ? reason : new Error(String(reason));
        applicationData?.cancel(error);
        // Close transport before aborting React: abort can synchronously write
        // client-render instructions, which must not escape a cancelled task.
        output.destroy(error);
        abortRender(error);
      };
      const abort = () =>
        fail(signal.reason || new Error('Application render aborted'));
      signal.addEventListener('abort', abort, { once: true });
      output.once('close', () => {
        signal.removeEventListener('abort', abort);
        if (!output.writableFinished)
          fail(new Error('Application stream was cancelled'));
      });
      const stream = Readable.toWeb(output) as ReadableStream<Uint8Array>;
      await new Promise<void>((resolve, reject) => {
        const rendered = renderToPipeableStream(element, {
          identifierPrefix: options.identifierPrefix,
          nonce: options.nonce,
          onShellReady() {
            try {
              applicationData = createApplicationData(getSnapshot());
              result = {
                stream,
                hydration: {
                  snapshot: Promise.resolve(applicationData.snapshot),
                  updates: applicationData.updates,
                  shellMarker,
                },
                cancel: fail,
              };
              rendered.pipe(output);
              resolve();
            } catch (error) {
              fail(error);
              reject(error);
            }
          },
          onShellError(error) {
            fail(error);
            reject(error);
          },
          onError(error) {
            options.onError?.(error);
            // Do not publish a successful hydration snapshot after React aborted
            // a boundary; the transport can now apply its failure policy.
            fail(error);
            reject(error);
          },
        });
        abortRender = rendered.abort;
        if (signal.aborted) {
          abort();
          reject(signal.reason);
        }
      });
      return new Response(stream);
    },
    { runtimeContext: prepared.context, runtime: prepared.runtime, root: Root },
  );
  const entryName = options.definition.entryName || 'index';
  const noop = () => {};
  const handlerOptions = {
    resource: {
      entryName,
      route: { entryName, urlPath: basename, isSSR: true },
      routeManifest: {},
      loadableStats: {},
      htmlTemplate: '',
    },
    config: { ssr: { mode: 'stream' }, nonce: options.nonce },
    params: {},
    loaderContext: options.loaderContext || new Map(),
    monitors: {
      error: options.onError || noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      push: noop,
      timing: noop,
      counter: noop,
    },
    onError: options.onError || noop,
    onTiming: noop,
  } as unknown as RequestHandlerOptions;
  let abortInitialization!: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    abortInitialization = () =>
      reject(signal.reason || new Error('Application request aborted'));
    signal.addEventListener('abort', abortInitialization, { once: true });
    if (signal.aborted) abortInitialization();
  });
  let response: Response;
  try {
    response = await Promise.race([
      handler(request, handlerOptions),
      cancelled,
    ]);
  } finally {
    signal.removeEventListener('abort', abortInitialization);
  }
  if (!result) {
    // Redirects and other short-circuit responses are not an application stream.
    throw new Error(
      `Application request returned HTTP ${response.status} before rendering`,
    );
  }
  return result;
}
