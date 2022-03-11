import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction, ProxyOptions } from '@modern-js/types';
import { formatProxyOptions } from '@modern-js/utils';
import { ModernServerContext } from './context';

export type { ProxyOptions };

export const createProxyHandler = (proxyOptions: ProxyOptions) => {
  if (!proxyOptions) {
    return null;
  }

  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formatedProxy = formatProxyOptions(proxyOptions);

  const middlewares = formatedProxy.map(option => {
    const middleware = createProxyMiddleware(option.context!, option);

    // eslint-disable-next-line consistent-return
    return async (ctx: ModernServerContext, next: NextFunction) => {
      const { req, res } = ctx;
      const bypassUrl =
        typeof option.bypass === 'function'
          ? option.bypass(req, res, option)
          : null;

      // only false, no true
      if (typeof bypassUrl === 'boolean') {
        ctx.status = 404;
        return next();
      } else if (typeof bypassUrl === 'string') {
        ctx.url = bypassUrl;
        return next();
      }

      (middleware as any)(req, res, next);
    };
  });

  return middlewares;
};
