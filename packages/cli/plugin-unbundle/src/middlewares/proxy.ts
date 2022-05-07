import { IncomingMessage, ServerResponse } from 'http';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction, BffProxyOptions } from '@modern-js/types';
import { formatProxyOptions } from '@modern-js/utils';

export const createProxyHandler = (proxyOptions?: BffProxyOptions) => {
  if (!proxyOptions) {
    return [
      (req: any, res: any, next: any) => {
        next();
      },
    ];
  }

  const formattedProxy = formatProxyOptions(proxyOptions);

  const middlewares = formattedProxy.map(option => {
    const middleware = createProxyMiddleware(option.context!, option);

    return async (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => {
      const bypassUrl =
        typeof option.bypass === 'function'
          ? option.bypass(req, res, option)
          : null;

      // only false, no true
      if (typeof bypassUrl === 'boolean') {
        res.statusCode = 404;
        return next();
      } else if (typeof bypassUrl === 'string') {
        req.url = bypassUrl;
        return next();
      }

      (middleware as any)(req, res, next);
    };
  });

  return middlewares;
};

export function proxyMiddleware(
  config: NormalizedConfig,
  _appContext: IAppContext,
) {
  const {
    tools: { devServer },
  } = config;

  return createProxyHandler(devServer?.proxy);
}
