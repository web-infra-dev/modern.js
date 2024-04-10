import { IncomingMessage, ServerResponse } from 'http';
import type { NestedRoute, ServerRoute } from '@modern-js/types';
import {
  installGlobals,
  writeReadableStreamToWritable,
  Response as NodeResponse,
} from '@remix-run/node';
import {
  createStaticHandler,
  UNSAFE_DEFERRED_SYMBOL as DEFERRED_SYMBOL,
  type UNSAFE_DeferredData as DeferredData,
  isRouteErrorResponse,
} from '@modern-js/runtime-utils/remix-router';
import { transformNestedRoutes } from '@modern-js/runtime-utils/browser';
import { isPlainObject } from '@modern-js/utils/lodash';
import {
  matchEntry,
  ServerContext,
  createRequestContext,
  reporterCtx,
} from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import { CONTENT_TYPE_DEFERRED, LOADER_ID_PARAM } from '../common/constants';
import { createDeferredReadableStream } from './response';

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

function convertModernRedirectResponse(headers: Headers, basename: string) {
  const newHeaders = new Headers(headers);
  let redirectUrl = headers.get('Location')!;

  // let client loader handle basename
  if (basename !== '/') {
    redirectUrl = redirectUrl.replace(basename, '');
  }
  newHeaders.set('X-Modernjs-Redirect', redirectUrl);
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

const createRequest = (context: ServerContext) => {
  const origin = `${context.protocol}://${context.host}`;
  // eslint-disable-next-line node/prefer-global/url
  const url = new URL(context.url, origin);

  const controller = new AbortController();

  const init: {
    [key: string]: unknown;
  } = {
    method: context.method,
    headers: createLoaderHeaders(context.headers),
    signal: controller.signal,
  };

  if (!['GET', 'HEAD'].includes(context.method.toUpperCase())) {
    init.body = context.req;
  }

  const request = new Request(url.href, init);

  return request;
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

export const handleRequest = async ({
  context,
  serverRoutes,
  routes: routesConfig,
}: {
  context: ServerContext;
  serverRoutes: ServerRoute[];
  routes: NestedRoute[];
}) => {
  const { query } = context;
  const routeId = query[LOADER_ID_PARAM] as string;
  const entry = matchEntry(context.path, serverRoutes);

  // LOADER_ID_PARAM is the indicator for CSR data loader request.
  if (!routeId || !entry) {
    return;
  }

  const basename = entry.urlPath;
  const end = time();
  const { res, logger, reporter } = context;
  const routes = transformNestedRoutes(routesConfig, reporter);
  const { queryRoute } = createStaticHandler(routes, {
    basename,
  });

  const request = createRequest(context);
  const requestContext = createRequestContext();
  // initial requestContext
  // 1. inject reporter
  requestContext.set(reporterCtx, reporter);

  let response;

  try {
    response = await queryRoute(request, {
      routeId,
      requestContext,
    });

    if (isResponse(response) && isRedirectResponse(response.status)) {
      response = convertModernRedirectResponse(
        response.headers as unknown as Headers,
        basename,
      );
    } else if (isPlainObject(response) && DEFERRED_SYMBOL in response) {
      const deferredData = response[DEFERRED_SYMBOL] as DeferredData;
      const body = createDeferredReadableStream(deferredData, request.signal);
      const init = deferredData.init || {};
      if (init.status && isRedirectResponse(init.status)) {
        if (!init.headers) {
          throw new Error('redirect response includes no headers');
        }
        response = convertModernRedirectResponse(
          new Headers(init.headers),
          basename,
        );
      } else {
        const headers = new Headers(init.headers);
        headers.set('Content-Type', `${CONTENT_TYPE_DEFERRED}; charset=UTF-8`);
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
    const message = isRouteErrorResponse(error) ? error.data : String(error);
    if (error instanceof Error) {
      logger?.error(`Error: ${error.name} ${error.message} ${error.stack}`);
    } else {
      logger?.error(message);
    }

    response = new NodeResponse(message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  const cost = end();
  reporter.reportTiming(`${LOADER_REPORTER_NAME}-navigation`, cost);
  await sendLoaderResponse(res, response);
};
