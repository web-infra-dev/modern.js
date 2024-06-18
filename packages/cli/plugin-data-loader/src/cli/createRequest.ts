/* eslint-disable node/prefer-global/url */
// Todo move this file to `runtime/` dir
import { compile } from 'path-to-regexp';
import { redirect } from '@modern-js/runtime-utils/router';
import { type UNSAFE_DeferredData as DeferredData } from '@modern-js/runtime-utils/remix-router';
import {
  LOADER_ID_PARAM,
  DIRECT_PARAM,
  CONTENT_TYPE_DEFERRED,
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

const handleDeferredResponse = async (res: Response) => {
  if (
    res.headers.get('Content-Type')?.match(CONTENT_TYPE_DEFERRED) &&
    res.body
  ) {
    return await parseDeferredReadableStream(res.body);
  }
  return res;
};

const isErrorResponse = (res: Response) => {
  return res.headers.get('X-Modernjs-Error') != null;
};

const handleErrorResponse = async (res: Response) => {
  if (isErrorResponse(res)) {
    const data = await res.json();
    const error = new Error(data.message);
    error.stack = data.stack;
    throw error;
  }
  return res;
};

export const createRequest = (routeId: string, method = 'get') => {
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
    });

    res = handleRedirectResponse(res);
    res = await handleErrorResponse(res);
    res = await handleDeferredResponse(res);

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
        // eslint-disable-next-line node/prefer-global/url-search-params
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
