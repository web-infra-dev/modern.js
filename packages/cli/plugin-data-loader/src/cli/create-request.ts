// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/prefer-global/url */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable node/no-unsupported-features/node-builtins */
import { compile } from 'path-to-regexp';
import { redirect } from 'react-router-dom';

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

const handleRedirectResponse = (res: Response) => {
  const { headers } = res;
  const location = headers.get('X-Modernjs-Redirect');
  if (location) {
    return redirect(location);
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
    const res = await fetch(url, {
      method,
      signal: request.signal,
    });
    if (!res.ok) {
      throw res;
    }
    return handleRedirectResponse(res);
  };
};
