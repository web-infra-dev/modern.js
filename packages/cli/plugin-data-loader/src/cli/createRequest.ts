// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/prefer-global/url */
import { compile } from 'path-to-regexp';
import { redirect } from 'react-router-dom';
import { type UNSAFE_DeferredData as DeferredData } from '@modern-js/utils/runtime';
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
    if (!res.ok) {
      throw res;
    }
    res = handleRedirectResponse(res);
    res = await handleDeferredResponse(res);
    return res;
  };
};
