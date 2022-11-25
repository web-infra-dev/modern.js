import { IncomingMessage, ServerResponse } from 'http';
import type { ServerPlugin } from '@modern-js/server-core';
import type { ModernServerContext, ServerRoute } from '@modern-js/types';
import {
  installGlobals,
  writeReadableStreamToWritable,
  Response as NodeResponse,
} from '@remix-run/node';
import {
  matchRoutes,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router-dom';
import { LOADER_ROUTES_DIR } from '@modern-js/utils';

type LoaderContext = {
  [key: string]: unknown;
};

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

type JsonFunction = <T>(
  data: T,
  init?: ResponseInit,
) => NodeResponse & {
  json: () => Promise<T>;
};

// Polyfill Web Fetch API
installGlobals();

const LOADER_SEARCH_PARAM = '_loader';

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectResponse(response: NodeResponse): boolean {
  return redirectStatusCodes.has(response.status);
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

const json: JsonFunction = (data, init = {}) => {
  const responseInit = typeof init === 'number' ? { status: init } : init;

  const headers = new Headers(responseInit.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  return new NodeResponse(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
};

// TODO: 添加 context
const callRouteLoader = async ({
  routeId,
  loader,
  params,
  request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext,
}: {
  request: Request;
  routeId: string;
  loader?: LoaderFunction;
  params: LoaderFunctionArgs['params'];
  loadContext: LoaderContext;
}) => {
  if (!loader) {
    throw new Error(
      `You made a ${request.method} request to ${request.url} but did not provide ` +
        `a default component or \`loader\` for route "${routeId}", ` +
        `so there is no way to handle the request.`,
    );
  }

  let result;

  try {
    result = await loader({
      request,
      params,
    });
  } catch (error) {
    if (!isResponse(error)) {
      throw error;
    }

    result = error;
  }

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return ` +
        `anything from your \`loader\` function. Please return a value or \`null\`.`,
    );
  }

  return isResponse(result) ? result : json(result);
};

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
  // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
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

export const getPathWithoutEntry = (pathname: string, entryPath: string) => {
  if (entryPath === '/') {
    return pathname;
  }
  return pathname.replace(entryPath, '');
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
  const routeId = query[LOADER_SEARCH_PARAM];
  if (!routeId || method.toLowerCase() !== 'get') {
    return;
  }

  const entry = matchEntry(context.path, serverRoutes);
  if (!entry) {
    return;
  }

  const { routes } = await import(
    `${distDir}/${LOADER_ROUTES_DIR}/${entry.entryName}`
  );

  if (!routes) {
    return;
  }

  const { res } = context;

  const pathname = getPathWithoutEntry(context.path, entry.urlPath);
  const matches = matchRoutes(routes, pathname);

  if (!matches) {
    res.statusCode = 403;
    res.end(`Route ${pathname} was not matched`);
    return;
  }

  const match = matches?.find(match => match.route.id === routeId);

  if (!match) {
    res.statusCode = 403;
    res.end(`Route ${routeId} does not match URL ${context.path}`);
    return;
  }

  const request = createLoaderRequest(context);
  let response;

  try {
    response = await callRouteLoader({
      loader: match.route.loader,
      routeId: match.route.id!,
      params: match.params,
      request,
      loadContext: {},
    });
    // TODO: 处理 redirect
  } catch (error) {
    const message = String(error);
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
