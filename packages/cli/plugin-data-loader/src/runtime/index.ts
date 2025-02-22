import { transformNestedRoutes } from '@modern-js/runtime-utils/browser';
import {
  createRequestContext,
  reporterCtx,
} from '@modern-js/runtime-utils/node';
import {
  UNSAFE_DEFERRED_SYMBOL as DEFERRED_SYMBOL,
  type UNSAFE_DeferredData as DeferredData,
  createStaticHandler,
  isRouteErrorResponse,
  json,
} from '@modern-js/runtime-utils/remix-router';
import { matchEntry } from '@modern-js/runtime-utils/server';
import { time } from '@modern-js/runtime-utils/time';
import type { NestedRoute, Reporter, ServerRoute } from '@modern-js/types';
import { isPlainObject } from '@modern-js/utils/lodash';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import { CONTENT_TYPE_DEFERRED, LOADER_ID_PARAM } from '../common/constants';
import { errorResponseToJson, serializeError } from './errors';
import { createDeferredReadableStream } from './response';

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectResponse(status: number): boolean {
  return redirectStatusCodes.has(status);
}

export function isResponse(value: any): value is Response {
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

  return new Response(null, {
    status: 204,
    headers: newHeaders,
  });
}

export const handleRequest = async ({
  request,
  serverRoutes,
  routes: routesConfig,
  context,
  onTiming,
}: {
  request: Request;
  serverRoutes: ServerRoute[];
  routes: NestedRoute[];
  onError?: (error: unknown) => void;
  onTiming?: (name: string, dur: number) => void;
  context: {
    loaderContext?: Map<string, unknown>;
    reporter?: Reporter;
  };
}): Promise<Response | void> => {
  const url = new URL(request.url);
  const routeId = url.searchParams.get(LOADER_ID_PARAM) as string;
  const entry = matchEntry(url.pathname, serverRoutes);
  // LOADER_ID_PARAM is the indicator for CSR data loader request.
  if (!routeId || !entry) {
    return;
  }

  const basename = entry.urlPath;
  const end = time();
  const { reporter, loaderContext } = context;
  const routes = transformNestedRoutes(routesConfig, reporter);
  const { queryRoute } = createStaticHandler(routes, {
    basename,
  });

  const requestContext = createRequestContext(loaderContext);
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
        response = new Response(body, init);
      }
    } else {
      response = isResponse(response)
        ? response
        : new Response(JSON.stringify(response), {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          });
    }
    const cost = end();
    // add response header for client know if the response is from modern server
    response.headers.set('X-Modernjs-Response', 'yes');
    onTiming?.(`${LOADER_REPORTER_NAME}-navigation`, cost);
  } catch (error) {
    if (isResponse(error)) {
      error.headers.set('X-Modernjs-Catch', 'yes');
      response = error;
    } else if (isRouteErrorResponse(error)) {
      response = errorResponseToJson(error);
    } else {
      const errorInstance =
        error instanceof Error || error instanceof DOMException
          ? error
          : new Error('Unexpected Server Error');

      // Handle errors uniformly using the application/json
      response = json(serializeError(errorInstance), {
        status: 500,
        headers: {
          'X-Modernjs-Error': 'yes',
        },
      });
    }
  }

  return response as unknown as Response;
};
