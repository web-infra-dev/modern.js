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
import { createInjectStream, getHost } from '../libs/utils';
import { ServerTiming } from '../libs/serverTiming';
import { createReadableStreamFromReadable } from '../adapters/stream';
import { REPLACE_REG } from '../libs/constants';

export interface SSRHandlerOptions {
  pwd: string;
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
  pwd,
  nonce,
  metaName,
  logger,
}: SSRHandlerOptions): Promise<Middleware<HonoNodeEnv>> {
  const { entryName } = routeInfo;
  const jsBundlePath = path.join(pwd, routeInfo.bundle!);
  const loadableUri = path.join(pwd, LOADABLE_STATS_FILE);
  const loadableStats = fs.existsSync(loadableUri)
    ? await import(loadableUri)
    : '';
  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);
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
        params: c.req.param() as Record<string, string>,
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

    const body =
      ssrResult instanceof Readable
        ? createReadableStreamFromReadable(ssrResult)
        : ssrResult;

    const serverData = {
      route: {
        baseUrl: c.req.path,
        params: c.req.param() as Record<string, any>,
      },
    };
    const data = injectServerData(body, serverData);

    return c.body(data, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
      },
    });
  };
}

function injectServerData(
  body: string | ReadableStream,
  serverData: Record<string, any>,
): ReadableStream | string {
  const { head } = REPLACE_REG.before;
  const searchValue = new RegExp(head);

  const replcaeCb = (beforeHead: string) =>
    `${beforeHead}<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      serverData,
    )}</script`;

  if (typeof body === 'string') {
    return body.replace(searchValue, replcaeCb);
  } else {
    const stream = createInjectStream(before => {
      return before.replace(searchValue, replcaeCb);
    });

    body.pipeThrough(stream);

    return stream.readable;
  }
}
