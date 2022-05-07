import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction, BffProxyOptions } from '@modern-js/types';
import { formatProxyOptions } from '@modern-js/utils';
import { debug } from '../utils';
import { ModernServerContext } from './context';

export type { BffProxyOptions };

export const createProxyHandler = (proxyOptions?: BffProxyOptions) => {
  debug('createProxyHandler', proxyOptions);
  if (!proxyOptions) {
    return null;
  }

  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formattedProxy = formatProxyOptions(proxyOptions);

  const middlewares = formattedProxy.map(option => {
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
