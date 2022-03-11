import { IncomingMessage, ServerResponse } from 'http';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction, ProxyOptions } from '@modern-js/types';
import { formatProxyOptions } from '@modern-js/utils';

export const createProxyHandler = (proxyOptions: ProxyOptions) => {
  if (!proxyOptions) {
    return [
      (req: any, res: any, next: any) => {
        next();
      },
    ];
  }

  const formatedProxy = formatProxyOptions(proxyOptions);

  const middlewares = formatedProxy.map(option => {
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

  const options = (devServer || {}).proxy as ProxyOptions;

  return createProxyHandler(options);
}
