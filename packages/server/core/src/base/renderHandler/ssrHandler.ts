import fs from 'fs';
import path from 'path';
import { Readable } from 'node:stream';
import {
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import { Logger, ServerRoute } from '@modern-js/types';
import * as isbot from 'isbot';
import { HonoNodeEnv, Middleware, SSRServerContext } from '../types';
import { defaultReporter } from '../libs/default';
import { getHost } from '../libs/utils';
import { ServerTiming } from '../libs/serverTiming';
import { createReadableStreamFromReadable } from '../adapters/stream';

export interface SSRHandlerOptions {
  distDir: string;
  mode: 'string' | 'stream';
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  metaName: string;
  logger: Logger;
  nonce?: string;
}
export async function createSSRHandler({
  html,
  routeInfo,
  staticGenerate,
  distDir,
  nonce,
  metaName,
  logger,
}: SSRHandlerOptions): Promise<Middleware<HonoNodeEnv>> {
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
      // TODO: get reporter from server.
      logger,
      reporter: defaultReporter,
      serverTiming: new ServerTiming(c, metaName),
      req: c.env.node?.req,
      res: c.env.node?.res,
      isSpider,
      nonce,
    };

    // TODO: ssr cache
    const jsBundle = await import(jsBundlePath);
    const render = jsBundle[SERVER_RENDER_FUNCTION_NAME];

    // FIXME: render should return string | ReadableStream
    const ssrResult: string | ReadableStream | Readable = await render(
      ssrContext,
    );

    const { redirection } = ssrContext;
    if (redirection.url) {
      return c.redirect(redirection.url, redirection.status);
    }

    const data =
      ssrResult instanceof Readable
        ? createReadableStreamFromReadable(ssrResult)
        : ssrResult;

    return c.body(data, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
      },
    });
  };
}
