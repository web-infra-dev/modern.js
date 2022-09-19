import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  ProxyDetail,
  NextFunction,
  BffProxyOptions,
  ModernServerContext,
} from '@modern-js/types';
import { debug } from '../utils';

export type { BffProxyOptions };

export function formatProxyOptions(proxyOptions: BffProxyOptions) {
  const formattedProxy: ProxyDetail[] = [];

  if (!Array.isArray(proxyOptions)) {
    if ('target' in proxyOptions) {
      formattedProxy.push(proxyOptions);
    } else {
      Array.prototype.push.apply(
        formattedProxy,
        Object.keys(proxyOptions).reduce(
          (total: ProxyDetail[], source: string) => {
            const option = (
              proxyOptions as
                | Record<string, string>
                | Record<string, ProxyDetail>
            )[source];

            total.push({
              context: source,
              changeOrigin: true,
              logLevel: 'warn',
              ...(typeof option === 'string' ? { target: option } : option),
            });
            return total;
          },
          [],
        ),
      );
    }
  } else {
    formattedProxy.push(...proxyOptions);
  }
  return formattedProxy;
}

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
