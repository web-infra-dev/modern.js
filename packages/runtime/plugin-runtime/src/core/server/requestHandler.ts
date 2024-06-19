import { ServerUserConfig } from '@modern-js/app-tools';
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

export type Resource = {
  loadableStats: Record<string, any>;
  routeManifest: Record<string, any>;
  htmlTemplate: string;
  entryName: string;
};

export type HandleRequestConfig = {
  nonce?: string;
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
  scriptLoading?: 'defer' | 'blocking' | 'module' | 'async';
  enableInlineStyles?: boolean | RegExp;
  enableInlineScripts?: boolean | RegExp;
  disablePrerender?: boolean;
  chunkLoadingGlobal?: string;
  unsafeHeaders?: string[];
} & Exclude<ServerUserConfig['ssr'], boolean>;

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

type LoaderContext = Map<string, any>;

export type RequestHandlerOptions = {
  resource: Resource;
  config: HandleRequestConfig;

  loaderContext: LoaderContext;

  /** @deprecated  */
  staticGenerate?: boolean;

  onError: (err: unknown) => void;
  onTiming: (name: string, dur: number) => void;
};

export type RequestHandler = (
  request: Request,
  options: RequestHandlerOptions,
) => Promise<Response>;

export type CreateRequestHandler = (
  handleRequest: HandleRequest,
) => Promise<RequestHandler>;

function createSSRContext(
  request: Request,
  options: RequestHandlerOptions,
): SSRServerContext {
  const { config, loaderContext, onError, onTiming } = options;

  const { nonce } = config;

  const cookie = request.headers.get('cookie');

  const cookieMap = parseCookie(request);

  const pathname = getPathname(request);

  const query = parseQuery(request);

  const headersData = parseHeaders(request);

  const url = new URL(request.url);

  return {
    nonce,
    loaderContext,
    redirection: {},
    htmlModifiers: [],
    request: {
      userAgent: request.headers.get('user-agent')!,
      cookie: cookie!,
      cookieMap,
      pathname,
      query,
      params: {},
      headers: headersData,
      host: url.host,
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
    onError,
    onTiming,
  };
}

export const createRequestHandler: CreateRequestHandler =
  async handleRequest => {
    const requestHandler: RequestHandler = async (request, options) => {
      const serverRoot = createRoot();

      const runner = getGlobalRunner();

      const context: RuntimeContext = getInitialContext(runner);

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

      const response = handleRequest(request, serverRoot, {
        ...options,
        runtimeContext: context,
      });

      return response;
    };

    return requestHandler;
  };
