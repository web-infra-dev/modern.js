import type { DeferredData } from '@modern-js/runtime-utils/browser';
import { redirect } from '@modern-js/runtime-utils/router';
// Todo move this file to `runtime/` dir
import { compile } from 'path-to-regexp';
import {
  CONTENT_TYPE_DEFERRED,
  DIRECT_PARAM,
  LOADER_ID_PARAM,
} from '../common/constants';
import { parseDeferredReadableStream } from './data';

export const getRequestUrl = ({
  params,
  request,
  routeId,
}: {
  params: Record<string, string>;
  request: Request;
  routeId: string;
}) => {
  const url = new URL(request.url);
  const toPath = compile(url.pathname, {
    encode: encodeURIComponent,
  });
  const newPathName = toPath(params);
  url.pathname = newPathName;
  url.searchParams.append(LOADER_ID_PARAM, routeId);
  url.searchParams.append(DIRECT_PARAM, 'true');
  return url;
};

const handleRedirectResponse = (res: Response) => {
  const { headers } = res;
  const location = headers.get('X-Modernjs-Redirect');
  if (location) {
    throw redirect(location);
  }
  return res;
};

const isDeferredResponse = (res: Response) => {
  return (
    res.headers.get('Content-Type')?.match(CONTENT_TYPE_DEFERRED) && res.body
  );
};

const isRedirectResponse = (res: Response) => {
  return res.headers.get('X-Modernjs-Redirect') != null;
};

const isErrorResponse = (res: Response) => {
  return res.headers.get('X-Modernjs-Error') != null;
};

function isOtherErrorResponse(res: Response) {
  return (
    res.status >= 400 &&
    res.headers.get('X-Modernjs-Error') == null &&
    res.headers.get('X-Modernjs-Catch') == null &&
    res.headers.get('X-Modernjs-Response') == null
  );
}

const isCatchResponse = (res: Response) => {
  return res.headers.get('X-Modernjs-Catch') != null;
};

const handleErrorResponse = async (res: Response) => {
  const data = await res.json();
  const error = new Error(data.message);
  error.stack = data.stack;
  throw error;
};

const handleNetworkErrorResponse = async (res: Response) => {
  const text = await res.text();
  const error = new Error(text);
  error.stack = undefined;
  throw error;
};

export const createRequest = (routeId: string, method = 'get') => {
  const isRouterV7 = process.env.ROUTER_VERSION === 'v7';
  return async ({
    params,
    request,
  }: {
    params: Record<string, string>;
    request: Request;
  }) => {
    const url = getRequestUrl({ params, request, routeId });
    let res: Response | DeferredData;
    res = await fetch(url, {
      method,
      signal: request.signal,
    }).catch(error => {
      throw error;
    });

    if (isRedirectResponse(res)) {
      return handleRedirectResponse(res);
    }

    if (isErrorResponse(res)) {
      return await handleErrorResponse(res);
    }

    if (isCatchResponse(res)) {
      throw res;
    }

    if (isDeferredResponse(res)) {
      const deferredData = await parseDeferredReadableStream(res.body!);
      return isRouterV7 ? deferredData.data : deferredData;
    }

    // some response error not from modern.js
    if (isOtherErrorResponse(res)) {
      return await handleNetworkErrorResponse(res);
    }

    return res;
  };
};

export const createActionRequest = (routeId: string) => {
  return async ({
    params,
    request,
  }: {
    params: Record<string, string>;
    request: Request;
  }) => {
    const url = getRequestUrl({ params, request, routeId });

    const init: RequestInit = {
      signal: request.signal,
    };
    if (request.method !== 'GET') {
      init.method = request.method;

      const contentType = request.headers.get('Content-Type');
      if (contentType && /\bapplication\/json\b/.test(contentType)) {
        init.headers = { 'Content-Type': contentType };
        init.body = JSON.stringify(await request.json());
      } else if (contentType && /\btext\/plain\b/.test(contentType)) {
        init.headers = { 'Content-Type': contentType };
        init.body = await request.text();
      } else if (
        contentType &&
        /\bapplication\/x-www-form-urlencoded\b/.test(contentType)
      ) {
        init.body = new URLSearchParams(await request.text());
      } else {
        init.body = await request.formData();
      }
    }

    const res: Response = await fetch(url, init);
    if (!res.ok) {
      throw res;
    }
    return res;
  };
};
