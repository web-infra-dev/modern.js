import { RequestHandler, RequestHandlerOptions } from '@modern-js/app-tools';
import {
  getPathname,
  parseCookie,
  parseHeaders,
  parseQuery,
} from '@modern-js/runtime-utils/universal';
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
  serverRoot: React.ComponentType, // App, routes,
  options: HandleRequestOptions,
) => Promise<Response>;

export type CreateRequestHandler = (
  handleRequest: HandleRequest,
) => Promise<RequestHandler>;

function createSSRContext(
  request: Request,
  options: RequestHandlerOptions,
): SSRServerContext {
  const {
    config,
    loaderContext,
    onError,
    onTiming,
    resource,
    staticGenerate,
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
    staticGenerate,
  );

  const ssrMode = getSSRMode(ssrConfig);

  const loaderFailureMode =
    typeof ssrConfig === 'object' ? ssrConfig.loaderFailureMode : undefined;

  return {
    nonce,
    loaderContext,
    redirection: {},
    htmlModifiers: [],
    request: {
      baseUrl: route.urlPath,
      userAgent: request.headers.get('user-agent')!,
      cookie: cookie!,
      cookieMap,
      pathname,
      query,
      params: {},
      headers: headersData,
      host: url.host,
      raw: request,
    },
    response: {
      // TODO: support response
      setHeader() {
        //
      },
      status(_code) {
        //
      },
      locals: {},
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
      const serverRoot = createRoot();

      const runner = getGlobalRunner();

      const { routeManifest } = options.resource;

      const context: RuntimeContext = getInitialContext(
        runner,
        false,
        routeManifest as any,
      );

      const runInit = (_context: RuntimeContext) =>
        runner.init(
          { context: _context },
          {
            onLast: ({ context: context1 }) => {
              const init = getGlobalAppInit();
              return init?.(context1);
            },
          },
        ) as any;

      const ssrContext = createSSRContext(request, options);

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

      const initialData = await runInit(context);

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

      const response = handleRequest(request, serverRoot, {
        ...options,
        runtimeContext: context,
      });

      return response;
    };

    return requestHandler;
  };
