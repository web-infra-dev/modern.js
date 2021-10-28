import { IncomingMessage, ServerResponse } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction } from '../type';
import { ModernServerContext } from './context';

type ProxyDetail = {
  target: string;
  pathRewrite?: Record<string, string>;
  secure?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: ProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
  changeOrigin?: boolean;
};

export type ProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;

export const createProxyHandler = (proxyOptions: ProxyOptions) => {
  if (!proxyOptions) {
    return null;
  }

  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formatedProxy: ProxyDetail[] = [];
  if (!Array.isArray(proxyOptions)) {
    if ('target' in proxyOptions) {
      formatedProxy.push(proxyOptions as ProxyDetail);
    } else {
      Array.prototype.push.apply(
        formatedProxy,
        Object.keys(proxyOptions).reduce(
          (total: ProxyDetail[], source: string) => {
            const option = proxyOptions[source];

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
    formatedProxy.concat(proxyOptions);
  }

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
