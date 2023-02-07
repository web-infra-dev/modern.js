import { Logger, LoggerInterface } from './libs/logger';
import { ModernRouteInterface, RouteMatchManager } from './libs/route';
import { metrics as defaultMetrics } from './libs/metrics';

export type Context = Record<string, any>;

export interface UrlQuery {
  [key: string]: string;
}

export type Manifest = {
  pages: Record<
    string, // path
    {
      entryName: string;
      template: string;
      serverRender: (ctx: Record<string, any>) => Promise<string>;
    }
  >;
  routes: ModernRouteInterface[];
};

export const handleUrl = (url: string) => {
  return url.replace(/^https?:\/\/.*?\//gi, '/');
};

export const createHandler = (manifest: Manifest) => {
  const routeMgr = new RouteMatchManager();
  const { pages, routes } = manifest;
  routeMgr.reset(routes);
  return async (ctx: Context) => {
    const pageMatch = routeMgr.match(ctx.url);
    if (!pageMatch) {
      ctx.body = '404: Page not found';
      ctx.status = 404;
      return;
    }
    const page = pages[pageMatch.spec.urlPath];
    ctx.request.query ??= ctx.query;
    ctx.request.pathname ??= ctx.pathname;
    ctx.request.params ??= ctx.params;
    const params = pageMatch.parseURLParams(ctx.url);
    ctx.body = await page.serverRender({
      entryName: page.entryName,
      template: page.template,
      query: ctx.query,
      request: ctx.request,
      response: ctx.response,
      pathname: ctx.pathname,
      req: ctx.request,
      res: ctx.response,
      params: ctx.params || params || {},
      logger:
        ctx.logger ||
        (new Logger({
          level: 'warn',
        }) as Logger & LoggerInterface),
      metrics: ctx.metrics || defaultMetrics,
    });
    ctx.status = 200;
  };
};
