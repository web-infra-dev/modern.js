import type {
  RequestHandler,
  RequestHandlerOptions,
} from '@modern-js/app-tools';
import type { DeferredData } from '@modern-js/runtime-utils/browser';
import { storage } from '@modern-js/runtime-utils/node';
import {
  getPathname,
  parseCookie,
  parseHeaders,
  parseQuery,
} from '@modern-js/runtime-utils/universal/request';
import React from 'react';
import { Fragment } from 'react';
import { handleRSCRedirect } from '../../router/runtime/rsc-router';
import {
  type TInternalRuntimeContext,
  getGlobalInternalRuntimeContext,
  getGlobalRSCRoot,
} from '../context';
import { getInitialContext } from '../context/runtime';
import { getServerPayload } from '../context/serverPayload';
import { createRoot } from '../react';
import type { SSRServerContext } from '../types';
import { CHUNK_CSS_PLACEHOLDER } from './constants';
import { SSRErrors } from './tracer';
import { getSSRConfigByEntry, getSSRMode } from './utils';

async function handleRSCRequest(
  request: Request,
  Root: React.ComponentType,
  context: TInternalRuntimeContext,
  options: RequestHandlerOptions,
  handleRequest: HandleRequest,
): Promise<Response> {
  const serverPayload = getServerPayload();

  if (typeof serverPayload !== 'undefined') {
    return await handleRequest(request, Root, {
      ...options,
      runtimeContext: context,
      rscRoot: serverPayload,
    });
  }

  const App = getGlobalRSCRoot();
  if (App) {
    return await handleRequest(request, Fragment, {
      ...options,
      runtimeContext: context,
      rscRoot: <App />,
    });
  }

  // Fallback when no RSC root is available
  return await handleRequest(request, Root, {
    ...options,
    runtimeContext: context,
  });
}

export type { RequestHandlerConfig as HandleRequestConfig } from '@modern-js/app-tools';

export type HandleRequestOptions = Exclude<
  RequestHandlerOptions,
  'staticGenerate'
> & {
  runtimeContext: TInternalRuntimeContext;
};

export type HandleRequest = (
  request: Request,
  ServerRoot: React.ComponentType, // App, routes,
  options: HandleRequestOptions,
) => Promise<Response>;

export type CreateRequestHandler = (
  handleRequest: HandleRequest,
  options?: {
    enableRsc?: boolean;
  },
) => Promise<RequestHandler>;

type ResponseProxy = {
  headers: Record<string, string>;
  status: number;
};

type RedirectContext = {
  enableRsc: boolean;
  isRSCNavigation: boolean;
  basename: string;
};

/**
 * Check if status code is a redirect (3xx)
 */
const isRedirectStatus = (status: number): boolean =>
  status >= 300 && status <= 399;

/**
 * Process redirect response based on context
 * - For RSC navigation: convert to X-Modernjs-Redirect format
 * - For SSR/CSR: return standard HTTP redirect
 */
const processRedirect = (
  headers: Headers,
  status: number,
  ctx: RedirectContext,
): Response => {
  if (ctx.enableRsc && ctx.isRSCNavigation) {
    return handleRSCRedirect(headers, ctx.basename, status);
  }
  return new Response(null, { status, headers });
};

function createSSRContext(
  request: Request,
  options: RequestHandlerOptions & {
    responseProxy: ResponseProxy;
  },
): SSRServerContext {
  const {
    config,
    loaderContext,
    onError,
    onTiming,
    locals,
    resource,
    params,
    responseProxy,
    reporter,
  } = options;

  const { nonce, useJsonScript } = config;

  const { entryName, route } = resource;

  const { headers } = request;

  const cookie = headers.get('cookie') || '';

  const cookieMap = parseCookie(request);

  const pathname = getPathname(request);

  const query = parseQuery(request);

  const headersData = parseHeaders(request);

  const url = new URL(request.url);

  const host =
    headers.get('X-Forwarded-Host') || headers.get('host') || url.host;

  let protocol = (
    headers.get('X-Forwarded-Proto') ||
    url.protocol ||
    'http'
  ).split(/\s*,\s*/, 1)[0];

  // The protocal including the final `:`.
  // Follow: https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol
  if (!protocol.endsWith(':')) {
    protocol += ':';
  }

  const ssrConfig = getSSRConfigByEntry(
    entryName,
    config.ssr,
    config.ssrByEntries,
  );
  let ssrMode = getSSRMode(ssrConfig);

  const isSsgRender = headers.get('x-modern-ssg-render') === 'true';
  if (isSsgRender) {
    const reactMajor = Number((React.version || '0').split('.')[0]);
    ssrMode = reactMajor >= 18 ? 'stream' : 'string';
  }

  const loaderFailureMode =
    typeof ssrConfig === 'object' ? ssrConfig.loaderFailureMode : undefined;

  return {
    nonce,
    useJsonScript,
    loaderContext,
    htmlModifiers: [],
    baseUrl: route.urlPath,
    request: {
      url: request.url.replace(url.host, host).replace(url.protocol, protocol),
      userAgent: headers.get('user-agent')!,
      cookie,
      cookieMap,
      pathname,
      query,
      params,
      headers: headersData,
      host,
      referer: headers.get('referer')!,
      raw: request,
    },
    response: {
      setHeader(key, value) {
        responseProxy.headers[key] = value;
      },
      status(code) {
        responseProxy.status = code;
      },
      locals: locals || {},
    },
    reporter,
    mode: ssrMode,
    onError,
    onTiming,
    loaderFailureMode,
  };
}

export const createRequestHandler: CreateRequestHandler = async (
  handleRequest,
  createRequestOptions,
) => {
  const requestHandler: RequestHandler = async (request, options) => {
    const headersData = parseHeaders(request);
    const responseProxy: ResponseProxy = {
      headers: {},
      status: -1,
    };
    const activeDeferreds = new Map<string, DeferredData>();
    return storage.run(
      {
        headers: headersData,
        request,
        monitors: options.monitors,
        responseProxy,
        activeDeferreds,
        serverPayload: undefined,
      },
      async () => {
        const Root = createRoot();

        const internalRuntimeContext = getGlobalInternalRuntimeContext();
        const hooks = internalRuntimeContext.hooks;

        const { routeManifest } = options.resource;

        const context: TInternalRuntimeContext = getInitialContext(
          false,
          routeManifest as any,
        );

        const runBeforeRender = async (
          context: TInternalRuntimeContext,
        ): Promise<Response | undefined> => {
          // when router is redirect, beforeRender will return a response
          const result = await hooks.onBeforeRender.call(context);
          if (typeof Response !== 'undefined' && result instanceof Response) {
            return result;
          }
        };

        const ssrContext = createSSRContext(request, {
          ...options,
          responseProxy,
        });

        Object.assign(context, {
          ssrContext,
          isBrowser: false,
        });

        // Prepare redirect context once for all redirect handling
        const redirectCtx: RedirectContext = {
          enableRsc: !!createRequestOptions?.enableRsc,
          isRSCNavigation: request.headers.get('x-rsc-tree') === 'true',
          basename: ssrContext.baseUrl || '/',
        };

        const beforeRenderResult = await runBeforeRender(context);

        // Support data loader to return `new Response` and set status code
        if (
          context.routerContext?.statusCode &&
          context.routerContext?.statusCode !== 200
        ) {
          context.ssrContext?.response.status(
            context.routerContext?.statusCode,
          );
        }

        // log error by monitors when data loader throw error
        const errors = Object.values(
          (context.routerContext?.errors || {}) as Record<string, Error>,
        );
        if (errors.length > 0) {
          options.onError(errors[0], SSRErrors.LOADER_ERROR);
        }

        // Handle redirect from loader (beforeRenderResult)
        if (
          typeof Response !== 'undefined' &&
          beforeRenderResult instanceof Response &&
          isRedirectStatus(beforeRenderResult.status)
        ) {
          // Already in RSC format (from plugin.node.tsx), return directly
          if (beforeRenderResult.headers.has('X-Modernjs-Redirect')) {
            return beforeRenderResult;
          }
          // Convert to appropriate format
          const redirectUrl = beforeRenderResult.headers.get('Location') || '/';
          return processRedirect(
            new Headers({ Location: redirectUrl }),
            beforeRenderResult.status,
            redirectCtx,
          );
        }

        if (!createRequestOptions?.enableRsc) {
          const { htmlTemplate } = options.resource;
          options.resource.htmlTemplate = htmlTemplate.replace(
            '</head>',
            `${CHUNK_CSS_PLACEHOLDER}</head>`,
          );
        }

        let response: Response;

        if (createRequestOptions?.enableRsc) {
          response = await handleRSCRequest(
            request,
            Root,
            context,
            options,
            handleRequest,
          );
        } else {
          response = await handleRequest(request, Root, {
            ...options,
            runtimeContext: context,
          });
        }

        // Handle redirect from component render (via responseProxy)
        if (
          responseProxy.status !== -1 &&
          isRedirectStatus(responseProxy.status) &&
          responseProxy.headers.Location
        ) {
          return processRedirect(
            new Headers(responseProxy.headers),
            responseProxy.status,
            redirectCtx,
          );
        }

        // Apply non-redirect responseProxy headers/status to response
        Object.entries(responseProxy.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        if (responseProxy.status !== -1) {
          return new Response(response.body, {
            status: responseProxy.status,
            headers: response.headers,
          });
        }

        return response;
      },
    );
  };

  return requestHandler;
};
