import url from 'url';
import { createDebugger } from '@modern-js/utils';
import { Middleware } from 'koa';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';

const debug = createDebugger('esm:history-api-fallback');

export const historyApiFallbackMiddleware = (
  userConfig: NormalizedConfig,
  appContext: IAppContext,
): Middleware => {
  const { serverRoutes } = appContext;

  return (ctx, next) => {
    const { headers, method } = ctx;
    const reqUrl = ctx.url;
    // eslint-disable-next-line node/no-deprecated-api
    const { pathname } = url.parse(reqUrl);

    if (method !== 'GET') {
      debug('Not rewriting', method, url, 'because the method is not GET.');
      return next();
    } else if (!headers || typeof headers.accept !== 'string') {
      debug(
        'Not rewriting',
        method,
        reqUrl,
        'because the client did not send an HTTP accept header.',
      );
      return next();
    } else if (headers.accept.startsWith('application/json')) {
      debug(
        'Not rewriting',
        method,
        reqUrl,
        'because the client prefers JSON.',
      );
      return next();
    } else if (!acceptsHtml(headers.accept)) {
      debug(
        'Not rewriting',
        method,
        reqUrl,
        'because the client does not accept HTML.',
      );
      return next();
    } else if (pathname!.lastIndexOf('.') > pathname!.lastIndexOf('/')) {
      debug(
        'Not rewriting',
        method,
        reqUrl,
        'because the path includes a dot (.) character.',
      );
      return next();
    }

    const sortedRoutes = serverRoutes.sort(
      (a, b) => b.urlPath.length - a.urlPath.length,
    );

    for (const { entryName, urlPath, isApi } of sortedRoutes) {
      if (pathname?.startsWith(urlPath)) {
        // should ignore api request
        if (isApi) {
          break;
        }

        if (entryName) {
          const rewriteTarget = appContext.htmlTemplates[entryName];

          debug('Rewriting', method, reqUrl, 'to', rewriteTarget);
          ctx.url = rewriteTarget;
          return next();
        }
      }
    }
    return next();
  };
};

/* eslint-disable @typescript-eslint/prefer-for-of */
function acceptsHtml(header: any) {
  const htmlAcceptHeaders = ['text/html', '*/*'];
  for (let i = 0; i < htmlAcceptHeaders.length; i++) {
    if (header.indexOf(htmlAcceptHeaders[i]) !== -1) {
      return true;
    }
  }
  return false;
}
/* eslint-enable @typescript-eslint/prefer-for-of */
