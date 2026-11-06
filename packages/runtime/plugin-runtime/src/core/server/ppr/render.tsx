import { Writable } from 'stream';
import { StringDecoder } from 'string_decoder';
import { storage } from '@modern-js/runtime-utils/node';
import type { PPRArtifact } from '@modern-js/types/server';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type React from 'react';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import type { TInternalRuntimeContext } from '../../context';
import { getGlobalInternalRuntimeContext } from '../../context';
import type { HandleRequestConfig } from '../requestHandler';
import type { SSRConfig } from '../shared';
import { buildShellAfterTemplate } from '../stream/afterTemplate';
import { buildShellBeforeTemplate } from '../stream/beforeTemplate';
import {
  enqueueFromEntries,
  hasDeferredResolvers,
} from '../stream/deferredScript';
import { DeferredScriptOutputCoordinator } from '../stream/deferredScriptOutputCoordinator';
import {
  createShellEndMarkSplitter,
  createStreamRootElement,
} from '../stream/shared';
import { splitHtmlTemplate } from '../stream/template';
import { SSRErrors } from '../tracer';
import {
  PPR_NONCE_PLACEHOLDER,
  createPrerenderRequestProxy,
  replaceNoncePlaceholder,
} from './state';

/**
 * Upper bound for the build-time prerender of one page. Work still pending
 * when it is reached is postponed to request time, so a slow component only
 * makes the prelude smaller, never wrong.
 */
const PRERENDER_TIMEOUT_MS = 1000;

export interface PPRRenderOptions {
  runtimeContext: TInternalRuntimeContext;
  htmlTemplate: string;
  entryName: string;
  config: HandleRequestConfig;
  ssrConfig: SSRConfig;
  onError: (error: unknown, key?: string) => void;
}

/** Response body of a build-time prerender request */
export interface PPRPrerenderResult {
  head: string;
  prelude: string;
  postponed: string | null;
  variant: Record<string, string>;
  dimensions: Record<string, string[]>;
}

function isAbortError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

/**
 * `prerender` ignores the `nonce` option, so the inline scripts React writes
 * into the prelude get the nonce placeholder here.
 */
function addNonceToBareScripts(html: string) {
  return html
    .split('<script>')
    .join(`<script nonce="${PPR_NONCE_PLACEHOLDER}">`);
}

function getExtenders() {
  const { hooks } = getGlobalInternalRuntimeContext();
  return hooks.extendStreamSSR.call() || [];
}

function prepareRootElement(
  serverRoot: React.ReactElement,
  runtimeContext: TInternalRuntimeContext,
) {
  const extenders = getExtenders();
  let rootElement = createStreamRootElement(serverRoot, runtimeContext);
  extenders.forEach(extender => {
    extender.init?.({ rootElement, forceStream2String: false });
  });
  extenders.forEach(extender => {
    if (extender.modifyRootElement) {
      rootElement = extender.modifyRootElement(rootElement);
    }
  });
  const getStyleTags = () =>
    extenders.map(extender => extender.getStyleTags?.() || '').join('');
  return { rootElement, getStyleTags };
}

/**
 * Renders the static part of a page at build time. Request data read during
 * render, and routes with data loaders, are postponed.
 */
export async function prerenderPage(
  serverRoot: React.ReactElement,
  options: PPRRenderOptions,
): Promise<PPRPrerenderResult> {
  const { prerender } = await import('react-dom/static');
  const { runtimeContext, htmlTemplate, entryName, config } = options;
  const ssrContext = runtimeContext.ssrContext!;
  const ppr = ssrContext.ppr!;

  const { rootElement, getStyleTags } = prepareRootElement(
    serverRoot,
    runtimeContext,
  );

  // Plugins have read the build request in `onBeforeRender`. From here on,
  // components reading it are postponed.
  const { request } = ssrContext;
  const requestProxy = createPrerenderRequestProxy(request);
  const swapRequest = (value: typeof request) => {
    ssrContext.request = value;
    for (const requestContext of [
      runtimeContext.requestContext,
      runtimeContext.context,
    ]) {
      if (requestContext) {
        requestContext.request = value;
      }
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PRERENDER_TIMEOUT_MS);
  let result: Awaited<ReturnType<typeof prerender>>;
  swapRequest(requestProxy);
  try {
    result = await prerender(rootElement, {
      signal: controller.signal,
      identifierPrefix: SSR_HYDRATION_ID_PREFIX,
      onError(error) {
        if (!isAbortError(error)) {
          options.onError(error, SSRErrors.RENDER_SHELL);
        }
      },
    });
  } finally {
    clearTimeout(timer);
    swapRequest(request);
  }

  const prelude = addNonceToBareScripts(
    await new Response(result.prelude).text(),
  );

  const { beforeAppTemplate } = splitHtmlTemplate(htmlTemplate);
  const head = await buildShellBeforeTemplate(beforeAppTemplate, {
    runtimeContext,
    entryName,
    config: { ...config, nonce: PPR_NONCE_PLACEHOLDER },
    styledComponentsStyleTags: getStyleTags(),
  });

  return {
    head,
    prelude,
    postponed: result.postponed ? JSON.stringify(result.postponed) : null,
    variant: { ...ppr.variant },
    dimensions: { ...ppr.dimensions },
  };
}

function scriptTag(content: string, nonce?: string) {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script${nonceAttr}>${content}</script>`;
}

/**
 * Serves a page from its prelude: the prelude is sent at once, loaders run
 * meanwhile, and the postponed parts are resumed once they finish.
 */
export function renderFromPrelude(
  request: Request,
  serverRoot: React.ReactElement,
  artifact: PPRArtifact,
  options: PPRRenderOptions,
): ReadableStream<Uint8Array> {
  const { runtimeContext, htmlTemplate, entryName, config, ssrConfig } =
    options;
  const ssrContext = runtimeContext.ssrContext!;
  const ppr = ssrContext.ppr!;
  const { nonce } = config;
  const encoder = new TextEncoder();
  // Resuming needs the exact element tree that was prerendered.
  const { rootElement } = prepareRootElement(serverRoot, runtimeContext);

  const prelude = replaceNoncePlaceholder(artifact.prelude, nonce);
  const head = replaceNoncePlaceholder(artifact.head, nonce);
  const markIndex = prelude.indexOf(ESCAPED_SHELL_STREAM_END_MARK);
  const shellInPrelude = markIndex !== -1;

  const buildShellAfter = (renderLevel: RenderLevel) => {
    const { afterAppHtmlTemplate } = splitHtmlTemplate(htmlTemplate);
    return buildShellAfterTemplate(afterAppHtmlTemplate, {
      request,
      runtimeContext,
      renderLevel,
      ssrConfig,
      entryName,
      config,
    });
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const emit = (chunk: string) => {
        if (!closed && chunk) {
          controller.enqueue(encoder.encode(chunk));
        }
      };
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };
      // The coordinator places deferred data scripts between React segments.
      // It only sees what follows the closed document; the prelude and the
      // template are written as they are, as complete HTML.
      const coordinator = new DeferredScriptOutputCoordinator(emit);

      emit(head + (shellInPrelude ? prelude.slice(0, markIndex) : prelude));

      const run = async () => {
        let interrupt: Response | undefined;
        try {
          interrupt = await ppr.pendingBeforeRender;
        } catch (error) {
          // `loaderFailureMode: 'clientRender'`: let the client render the
          // page and run its loaders again.
          options.onError(error, SSRErrors.LOADER_ERROR);
          emit(await buildShellAfter(RenderLevel.CLIENT_RENDER));
          return;
        }

        if (interrupt) {
          // Headers are sent with the prelude, so redirect on the client.
          const location = interrupt.headers.get('Location') || '/';
          emit(
            scriptTag(`location.replace(${JSON.stringify(location)})`, nonce),
          );
          return;
        }

        const loaderErrors = Object.values(
          (runtimeContext.routerContext?.errors || {}) as Record<string, Error>,
        );
        if (loaderErrors.length > 0) {
          // A route error boundary replaces the route element, which may be
          // part of the prelude, so the page cannot be resumed from it. Let
          // the client render the page and its error boundary.
          options.onError(loaderErrors[0], SSRErrors.LOADER_ERROR);
          emit(await buildShellAfter(RenderLevel.CLIENT_RENDER));
          return;
        }

        const routerData = ppr.renderRouterData?.() || '';

        const requestStorage = storage.useContext?.();
        const activeDeferreds = requestStorage?.activeDeferreds;
        const deferredScriptKeys = requestStorage?.deferredScriptKeys;
        const entries: Array<[string, unknown]> =
          activeDeferreds instanceof Map
            ? Array.from(activeDeferreds.entries())
            : [];
        const hasResolvers = hasDeferredResolvers(entries, deferredScriptKeys);
        if (!hasResolvers) {
          coordinator.markNoResolvers();
        }

        let renderLevel = RenderLevel.SERVER_RENDER;
        let shellFinished = false;
        const finishShell = async (beforeMark: string, afterMark: string) => {
          shellFinished = true;
          emit(
            `${beforeMark}${routerData}${await buildShellAfter(renderLevel)}`,
          );
          coordinator.writeReact(afterMark);
          coordinator.markShellFinished();
        };

        const resolversDone = hasResolvers
          ? enqueueFromEntries(entries, deferredScriptKeys, nonce, script =>
              coordinator.enqueueResolver(script),
            )
          : Promise.resolve();

        if (shellInPrelude) {
          await finishShell(
            '',
            prelude.slice(markIndex + ESCAPED_SHELL_STREAM_END_MARK.length),
          );
        }

        if (artifact.postponed) {
          await resume(rootElement, artifact.postponed, {
            nonce,
            onShellError(error) {
              renderLevel = RenderLevel.CLIENT_RENDER;
              options.onError(error, SSRErrors.RENDER_SHELL);
            },
            onError(error) {
              options.onError(error, SSRErrors.RENDER_STREAM);
            },
            write: shellInPrelude
              ? chunk => coordinator.writeReact(chunk)
              : createShellSplitWriter(
                  chunk => coordinator.writeReact(chunk),
                  finishShell,
                ),
          });
        }

        if (!shellFinished) {
          // The postponed shell failed to render: let the client render it.
          renderLevel = RenderLevel.CLIENT_RENDER;
          await finishShell('', '');
        }

        await resolversDone;
        coordinator.finish();
      };

      run()
        .catch(error => {
          options.onError(error, SSRErrors.RENDER_STREAM);
          coordinator.abort();
        })
        .finally(close);
    },
  });
}

type ShellWriter = (chunk: string) => Promise<void> | void;

/**
 * When the prelude ends inside the postponed shell, the resumed output
 * carries the end-of-shell marker; the rest of the template goes there.
 */
function createShellSplitWriter(
  write: (chunk: string) => void,
  finishShell: (beforeMark: string, afterMark: string) => Promise<void>,
): ShellWriter {
  const split = createShellEndMarkSplitter();
  let done = false;
  return async chunk => {
    if (done) {
      write(chunk);
      return;
    }
    const shell = split(chunk);
    if (shell) {
      done = true;
      await finishShell(shell.beforeMark, shell.afterMark);
    }
  };
}

function resume(
  rootElement: React.ReactElement,
  postponedText: string,
  options: {
    nonce?: string;
    write: ShellWriter;
    onShellError: (error: unknown) => void;
    onError: (error: unknown) => void;
  },
): Promise<void> {
  return import('react-dom/server').then(
    ({ resumeToPipeableStream }) =>
      new Promise<void>((resolve, reject) => {
        const decoder = new StringDecoder('utf8');
        let shellErrored = false;
        // Writes are chained so that template parts awaited by the writer
        // keep their place in the output.
        let pending = Promise.resolve();
        const destination = new Writable({
          write(chunk, _encoding, callback) {
            const text = decoder.write(
              Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
            );
            pending = pending.then(() => options.write(text));
            pending.then(() => callback(), callback);
          },
          final(callback) {
            const text = decoder.end();
            pending = pending.then(() => options.write(text));
            pending.then(() => callback(), callback);
          },
        });
        destination.on('finish', resolve);
        destination.on('error', error => {
          // React ends the stream with the error when the shell fails; that
          // failure is reported through `onShellError` and handled by the caller.
          if (shellErrored) {
            resolve();
          } else {
            reject(error);
          }
        });

        // Typed as a promise in @types/react-dom, but returns synchronously.
        const { pipe } = (
          resumeToPipeableStream as unknown as (
            ...args: Parameters<typeof resumeToPipeableStream>
          ) => Awaited<ReturnType<typeof resumeToPipeableStream>>
        )(rootElement, JSON.parse(postponedText), {
          nonce: options.nonce,
          onShellError(error) {
            shellErrored = true;
            options.onShellError(error);
          },
          onError: options.onError,
        });
        pipe(destination);
      }),
  );
}
