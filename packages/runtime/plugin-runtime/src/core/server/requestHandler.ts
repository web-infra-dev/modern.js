import { RequestHandler, RequestHandlerOptions } from '@modern-js/app-tools';
import {
  getPathname,
  parseCookie,
  parseHeaders,
  parseQuery,
} from '@modern-js/runtime-utils/universal/request';
import React from 'react';
import { createRoot } from '../react';
import { RuntimeContext, getGlobalAppInit } from '../context';
import { getGlobalRunner } from '../plugin/runner';
import { getInitialContext } from '../context/runtime';
import { createLoaderManager } from '../loader/loaderManager';
import { SSRServerContext } from '../types';
import { getSSRConfigByEntry, getSSRMode } from './utils';
import { CHUNK_CSS_PLACEHOLDER } from './constants';

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

  const { nonce } = config;

  const { entryName, route } = resource;

  const cookie = request.headers.get('cookie');

  const cookieMap = parseCookie(request);

  const pathname = getPathname(request);

  const query = parseQuery(request);

  const headersData = parseHeaders(request);

  const url = new URL(request.url);

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
    loaderContext,
    redirection: {},
    htmlModifiers: [],
    logger,
    metrics,
    request: {
      baseUrl: route.urlPath,
      userAgent: request.headers.get('user-agent')!,
      cookie: cookie!,
      cookieMap,
      pathname,
      query,
      params,
      headers: headersData,
      host: url.host,
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

export const createRequestHandler: CreateRequestHandler =
  async handleRequest => {
    const requestHandler: RequestHandler = async (request, options) => {
      const Root = createRoot();

      const runner = getGlobalRunner();

      const { routeManifest } = options.resource;

      const context: RuntimeContext = getInitialContext(
        runner,
        false,
        routeManifest as any,
      );

      const runBeforeRender = async (_context: RuntimeContext) => {
        // when router is redirect, beforeRender when return a response
        const context = await runner.beforeRender(_context);
        if (typeof Response !== 'undefined' && context instanceof Response) {
          return context;
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
