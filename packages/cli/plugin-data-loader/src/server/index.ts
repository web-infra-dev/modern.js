import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';
import type { ModernServerContext, ServerRoute } from '@modern-js/types';
import {
  installGlobals,
  writeReadableStreamToWritable,
  Response as NodeResponse,
} from '@remix-run/node';
import {
  MAIN_ENTRY_NAME,
  SERVER_BUNDLE_DIRECTORY,
  transformNestedRoutes,
} from '@modern-js/utils';
import {
  createStaticHandler,
  ErrorResponse,
  UNSAFE_DEFERRED_SYMBOL as DEFERRED_SYMBOL,
  type UNSAFE_DeferredData as DeferredData,
} from '@remix-run/router';
import { LOADER_ID_PARAM } from '../common/constants';
import { createDeferredReadableStream } from './response';

export type ServerContext = Pick<
  ModernServerContext,
  | 'req'
  | 'res'
  | 'params'
  | 'headers'
  | 'method'
  | 'url'
  | 'host'
  | 'protocol'
  | 'origin'
  | 'href'
  | 'path'
  | 'query'
>;

// Polyfill Web Fetch API
installGlobals();

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectResponse(status: number): boolean {
  return redirectStatusCodes.has(status);
}

export function isResponse(value: any): value is NodeResponse {
  return (
    value != null &&
    typeof value.status === 'number' &&
    typeof value.statusText === 'string' &&
    typeof value.headers === 'object' &&
    typeof value.body !== 'undefined'
  );
}

function convertModernRedirectResponse(headers: Headers) {
  const newHeaders = new Headers(headers);
  newHeaders.set('X-Modernjs-Redirect', headers.get('Location')!);
  newHeaders.delete('Location');

  return new NodeResponse(null, {
    status: 204,
    headers: newHeaders,
  });
}

const createLoaderHeaders = (
  requestHeaders: IncomingMessage['headers'],
): Headers => {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
};

const createLoaderRequest = (context: ServerContext) => {
  const origin = `${context.protocol}://${context.host}`;
  // eslint-disable-next-line node/prefer-global/url
  const url = new URL(context.url, origin);

  const controller = new AbortController();

  const init = {
    method: context.method,
    headers: createLoaderHeaders(context.headers),
    signal: controller.signal,
  };

  return new Request(url.href, init);
};

const sendLoaderResponse = async (
  res: ServerResponse,
  nodeResponse: NodeResponse,
) => {
  res.statusMessage = nodeResponse.statusText;
  res.statusCode = nodeResponse.status;

  for (const [key, value] of nodeResponse.headers.entries()) {
    res.setHeader(key, value);
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
};

const matchEntry = (pathname: string, entries: ServerRoute[]) => {
  return entries.find(entry => pathname.startsWith(entry.urlPath));
};

export const handleRequest = async ({
  context,
  serverRoutes,
  distDir,
}: {
  context: ServerContext;
  serverRoutes: ServerRoute[];
  distDir: string;
}) => {
  const { method, query } = context;
  const routeId = query[LOADER_ID_PARAM] as string;
  if (!routeId || method.toLowerCase() !== 'get') {
    return;
  }

  const entry = matchEntry(context.path, serverRoutes);
  if (!entry) {
    return;
  }

  const routesPath = path.join(
    distDir,
    SERVER_BUNDLE_DIRECTORY,
    `${entry.entryName || MAIN_ENTRY_NAME}-server-loaders`,
  );
  const { routes } = await import(routesPath);

  if (!routes) {
    return;
  }

  const dataRoutes = transformNestedRoutes(routes);
  const staticHandler = createStaticHandler(dataRoutes, {
    basename: entry.urlPath,
  });

  const { res } = context;

  const request = createLoaderRequest(context);
  let response;

  try {
    response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: context,
    });

    if (isResponse(response) && isRedirectResponse(response.status)) {
      response = convertModernRedirectResponse(response.headers);
    } else if (DEFERRED_SYMBOL in response) {
      const deferredData = response[DEFERRED_SYMBOL] as DeferredData;
      const body = createDeferredReadableStream(deferredData, request.signal);
      const init = deferredData.init || {};
      if (init.status && isRedirectResponse(init.status)) {
        if (!init.headers) {
          throw new Error('redirect response includes no headers');
        }
        response = convertModernRedirectResponse(new Headers(init.headers));
      } else {
        const headers = new Headers(init.headers);
        headers.set('Content-Type', 'text/modernjs-deferred');
        init.headers = headers;
        response = new NodeResponse(body, init);
      }
    } else {
      response = isResponse(response)
        ? response
        : new NodeResponse(JSON.stringify(response), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          });
    }
  } catch (error) {
    const message = error instanceof ErrorResponse ? error.data : String(error);
    response = new NodeResponse(message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  sendLoaderResponse(res, response);
};

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-data-loader',
  setup: () => ({
    preparebeforeRouteHandler({
      serverRoutes,
      distDir,
    }: {
      serverRoutes: ServerRoute[];
      distDir: string;
    }) {
      return async (context: ServerContext) => {
        return handleRequest({
          serverRoutes,
          distDir,
          context,
        });
      };
    },
  }),
});
