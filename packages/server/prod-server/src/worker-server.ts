import { ModernRouteInterface, RouteMatchManager } from './libs/route';

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
      template: page.template,
      query: ctx.query,
      request: ctx.request,
      response: ctx.response,
      pathname: ctx.pathname,
      req: ctx.request,
      res: ctx.response,
      params: ctx.params || params || {},
    });
    ctx.status = 200;
  };
};
