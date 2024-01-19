import fs from 'fs';
import path from 'path';
import {
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import * as isbot from 'isbot';
import { HonoRequest, Middleware, SSRServerContext } from '../types';
import {
  defaultLogger,
  defaultMetrics,
  defaultReporter,
} from '../libs/default';
import { ServerTiming } from '../libs/serverTiming';

export interface SSRHandlerOptions {
  distDir: string;
  mode: 'string' | 'stream';
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  metaName: string;
  nonce?: string;
}
export async function createSSRHandler({
  html,
  routeInfo,
  staticGenerate,
  distDir,
  nonce,
  metaName,
}: SSRHandlerOptions): Promise<Middleware> {
  const { entryName } = routeInfo;
  const jsBundlePath = path.join(distDir, routeInfo.bundle!);
  const loadableUri = path.join(distDir, LOADABLE_STATS_FILE);
  const loadableStats = fs.existsSync(loadableUri)
    ? await import(loadableUri)
    : '';
  const routesManifestUri = path.join(distDir, ROUTE_MANIFEST_FILE);
  const routeManifest = fs.existsSync(routesManifestUri)
    ? await import(routesManifestUri)
    : undefined;

  return async c => {
    const { req } = c;
    const host = getHost(req);

    const isSpider = isbot.default(c.req.header('user-agent'));

    const ssrContext: SSRServerContext = {
      request: {
        baseUrl: routeInfo.urlPath,
        // FIXME: pass params from routes
        params: {},
        pathname: req.path,
        host,
        query: req.query(),
        url: req.url,
        headers: req.header(),
      },
      response: {
        setHeader(key, value) {
          c.header(key, value);
        },
        status(code) {
          c.status(code);
        },
        // FIXME: get locals from somewhere
        locals: {},
      },

      redirection: {},
      template: html,
      loadableStats,
      routeManifest, // for streaming ssr
      entryName: entryName!,
      staticGenerate,

      // TODO: get logger, metrics, reporter from server.
      logger: defaultLogger,
      metrics: defaultMetrics as any,
      reporter: defaultReporter,
      serverTiming: new ServerTiming(c, metaName),

      // FIXME: this req, res is NodeReq, NodeRes
      req: c.req as any,
      res: c.res as any,
      isSpider,
      nonce,
    };

    // TODO: ssr cache
    const jsBundle = await import(jsBundlePath);
    const render = jsBundle[SERVER_RENDER_FUNCTION_NAME];

    // TODO: streaming ssr
    const ssrResult: string = render(ssrContext);

    const { redirection } = ssrContext;
    if (redirection.url) {
      return c.redirect(redirection.url, redirection.status);
    }

    return c.html(ssrResult);
  };
}

function getHost(req: HonoRequest) {
  let host = req.header('X-Forwarded-Host');
  if (!host) {
    host = req.header('Host');
  }
  host = (host as string).split(/\s*,\s*/, 1)[0] || 'undefined';
  // the host = '',if we can't cat Host or X-Forwarded-Host header
  // but the this.href would assign a invalid value:`http[s]://${pathname}`
  // so we need assign host a no-empty value.
  return host;
}