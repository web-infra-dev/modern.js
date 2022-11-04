// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/prefer-global/url */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/no-unsupported-features/node-builtins */
import { compile } from 'path-to-regexp';

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
  url.searchParams.append('_loader', routeId);
  return url;
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
    try {
      const res = await fetch(url, {
        method,
        signal: request.signal,
      });
      return res;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
};
