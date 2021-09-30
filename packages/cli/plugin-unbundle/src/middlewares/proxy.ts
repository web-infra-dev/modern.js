import * as http from 'http';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { Options, RequestHandler } from 'http-proxy-middleware';

export interface ProxyOptions extends Options {
  /**
   * webpack-dev-server style bypass function
   */
  bypass?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    options: ProxyOptions,
  ) => null | undefined | false | string;
}

export function proxyMiddleware(
  config: NormalizedConfig,
  _appContext: IAppContext,
): any[] {
  const {
    tools: { devServer },
  } = config;

  const options = (devServer || {}).proxy as Record<string, ProxyOptions>;

  // const isUseBff = shouldUseBff(appDirectory, api);

  if (!options) {
    return [
      (req: any, res: any, next: any) => {
        next();
      },
    ];
  }

  const proxies: Record<string, [RequestHandler, ProxyOptions]> = {};

  // if (isUseBff) {
  //   const apiPrefix = bffConfig?.prefix || '/api';

  //   const context = (pathname: string, req: any) => {
  //     if (
  //       pathname.startsWith(apiPrefix) &&
  //       !req.url.endsWith(`${LAMBDA_API_FUNCTION_QUERY}`)
  //     ) {
  //       return true;
  //     }
  //     return false;
  //   };
  //   const opts = { target: `http://127.0.0.1:${process.env.BFF_PORT || 8086}` };
  //   proxies[context as any] = [
  //     require('http-proxy-middleware').createProxyMiddleware(context, opts),
  //     opts,
  //   ];
  // }
  if (options) {
    Object.keys(options).forEach(context => {
      let opts = options[context];
      if (typeof opts === 'string') {
        opts = { target: opts };
      }
      const proxy = require('http-proxy-middleware').createProxyMiddleware(
        context,
        opts,
      );

      proxies[context] = [proxy, { ...opts }];
    });
  }

  return Object.keys(proxies).map(
    context =>
      function (req: any, res: any, next: any) {
        const [proxy] = proxies[context];

        return proxy(req, res, next);
      },
  );
}
