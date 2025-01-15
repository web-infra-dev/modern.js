import type {
  RequestHandler,
  RequestHandlerOptions,
} from '@modern-js/app-tools';
import {
  getPathname,
  parseCookie,
  parseHeaders,
  parseQuery,
} from '@modern-js/runtime-utils/universal/request';
import type React from 'react';
import { Fragment, type ReactNode, createElement } from 'react';
import {
  type RuntimeContext,
  getGlobalApp,
  getGlobalAppInit,
  getGlobalLayoutApp,
  getGlobalRSCRoot,
} from '../context';
import { getInitialContext } from '../context/runtime';
import { createLoaderManager } from '../loader/loaderManager';
import { getGlobalRunner } from '../plugin/runner';
import { createRoot } from '../react';
import type { SSRServerContext } from '../types';
import { CHUNK_CSS_PLACEHOLDER } from './constants';
import { getSSRConfigByEntry, getSSRMode } from './utils';

export type { RequestHandlerConfig as HandleRequestConfig } from '@modern-js/app-tools';

export type HandleRequestOptions = Exclude<
  RequestHandlerOptions,
  'staticGenerate'
> & {
  runtimeContext: RuntimeContext;
};

export type HandleRequest = (
  request: Request,
  ServerRoot: React.ComponentType, // App, routes,
  options: HandleRequestOptions,
) => Promise<Response>;

export type CreateRequestHandler = (
  handleRequest: HandleRequest,
  options?: {
    enableRsc: boolean;
  },
) => Promise<RequestHandler>;

type ResponseProxy = {
  headers: Record<string, string>;
  code: number;
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
    logger,
    metrics,
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
  const ssrMode = getSSRMode(ssrConfig);

  const loaderFailureMode =
    typeof ssrConfig === 'object' ? ssrConfig.loaderFailureMode : undefined;

  return {
    nonce,
    useJsonScript,
    loaderContext,
    redirection: {},
    htmlModifiers: [],
    logger,
    metrics,
    request: {
      url: request.url.replace(url.host, host).replace(url.protocol, protocol),
      baseUrl: route.urlPath,
      userAgent: headers.get('user-agent')!,
      cookie,
      cookieMap,
      pathname,
      query,
      params,
      headers: headersData,
      host,
      raw: request,
    },
    response: {
      setHeader(key, value) {
        responseProxy.headers[key] = value;
      },
      status(code) {
        responseProxy.code = code;
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
    const Root = createRoot();

    const runner = getGlobalRunner();

    const { routeManifest } = options.resource;

    const context: RuntimeContext = getInitialContext(
      runner,
      false,
      routeManifest as any,
    );

    const runBeforeRender = async (context: RuntimeContext) => {
      // when router is redirect, beforeRender will return a response
      const result = await runner.beforeRender(context);
      if (typeof Response !== 'undefined' && result instanceof Response) {
        return result;
      }
      const init = getGlobalAppInit();
      return init?.(context);
    };

    const responseProxy: ResponseProxy = {
      headers: {},
      code: -1,
    };

    const ssrContext = createSSRContext(request, {
      ...options,
      responseProxy,
    });

    Object.assign(context, {
      ssrContext,
      isBrowser: false,
      loaderManager: createLoaderManager(
        {},
        {
          skipNonStatic: options.staticGenerate,
          // if not static generate, only non-static loader can exec on prod env
          skipStatic:
            process.env.NODE_ENV === 'production' && !options.staticGenerate,
        },
      ),
    });

    // Handle redirects from React Router with an HTTP redirect
    const getRedirectResponse = (result: any) => {
      if (
        typeof Response !== 'undefined' && // fix: ssg workflow doesn't inject Web Response
        result instanceof Response &&
        result.status >= 300 &&
        result.status <= 399
      ) {
        const { status } = result;
        const redirectUrl = result.headers.get('Location') || '/';
        const { ssrContext } = context;
        if (ssrContext) {
          return new Response(null, {
            status,
            headers: {
              Location: redirectUrl,
            },
          });
        }
      }
      return undefined;
    };

    const initialData = await runBeforeRender(context);

    // Support data loader to return `new Response` and set status code
    if (
      context.routerContext?.statusCode &&
      context.routerContext?.statusCode !== 200
    ) {
      context.ssrContext?.response.status(context.routerContext?.statusCode);
    }

    context.initialData = initialData;

    const redirectResponse = getRedirectResponse(initialData);

    if (redirectResponse) {
      return redirectResponse;
    }

    const { htmlTemplate } = options.resource;

    options.resource.htmlTemplate = htmlTemplate.replace(
      '</head>',
      `${CHUNK_CSS_PLACEHOLDER}</head>`,
    );

    const response = await handleRequest(request, Root, {
      ...options,
      runtimeContext: context,
      RSCRoot: createRequestOptions?.enableRsc && getGlobalRSCRoot(),
    });

    Object.entries(responseProxy.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    if (responseProxy.code !== -1) {
      return new Response(response.body, {
        status: responseProxy.code,
        headers: response.headers,
      });
    }

    return response;
  };

  return requestHandler;
};
