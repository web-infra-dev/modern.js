import { RequestHandler, createProxyMiddleware } from 'http-proxy-middleware';
import {
  ProxyDetail,
  NextFunction,
  BffProxyOptions,
  ModernServerContext,
} from '@modern-js/types';
import { debug } from '../utils';
import type { ModernServerHandler } from '../type';

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

export type HttpUpgradeHandler = NonNullable<RequestHandler['upgrade']>;

export const createProxyHandler = (proxyOptions?: BffProxyOptions) => {
  debug('createProxyHandler', proxyOptions);
  const middlewares: RequestHandler[] = [];
  const handlers: ModernServerHandler[] = [];

  const handleUpgrade: HttpUpgradeHandler = (req, socket, head) => {
    for (const middleware of middlewares) {
      if (typeof middleware.upgrade === 'function') {
        middleware.upgrade(req, socket, head);
      }
    }
  };

  if (!proxyOptions) {
    return { handlers, handleUpgrade };
  }

  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formattedOptionsList = formatProxyOptions(proxyOptions);

  for (const options of formattedOptionsList) {
    const middleware = createProxyMiddleware(options.context!, options);
    const handler = async (ctx: ModernServerContext, next: NextFunction) => {
      const { req, res } = ctx;
      const bypassUrl =
        typeof options.bypass === 'function'
          ? options.bypass(req, res, options)
          : null;

      // only false, no true
      if (typeof bypassUrl === 'boolean') {
        ctx.status = 404;
        next();
      } else if (typeof bypassUrl === 'string') {
        ctx.url = bypassUrl;
        next();
      } else {
        middleware(req as any, res as any, next);
      }
    };
    middlewares.push(middleware);
    handlers.push(handler);
  }

  return { handlers, handleUpgrade };
};
