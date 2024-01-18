import { readFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import {
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
  cutNameByHyphen,
} from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import * as isbot from 'isbot';
import { HonoRequest, Middleware, SSRServerContext } from '../types';

export interface CreateRenderHOptions {
  routeInfo: ServerRoute;
  distDir: string;
  metaName: string;
  staticGenerate?: boolean;
  forceCSR?: boolean;
}

export async function createRenderHandler(
  options: CreateRenderHOptions,
): Promise<Middleware> {
  const {
    forceCSR,
    metaName,
    routeInfo,
    distDir,
    staticGenerate = false,
  } = options;

  const htmlPath = path.join(distDir, routeInfo.entryPath);
  const html = await readFile(htmlPath, 'utf-8');

  return async (c, _) => {
    const renderMode = getRenderMode(
      c.req,
      metaName,
      routeInfo.isSSR,
      forceCSR,
    );

    const handler =
      renderMode === 'csr'
        ? createCSRHandler(html)
        : await createSSRHandler({
            distDir,
            html,
            staticGenerate,
            mode: routeInfo.isStream ? 'stream' : 'string',
            routeInfo,
          });

    return handler(c, _);
  };
}

function createCSRHandler(html: string): Middleware {
  return async c => {
    return c.html(html);
  };
}

interface SSRHandlerOptions {
  distDir: string;
  mode: 'string' | 'stream';
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  nonce?: string;
}

async function createSSRHandler({
  html,
  routeInfo,
  staticGenerate,
  distDir,
  nonce,
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
    // FIXME: how get host
    const host = req.header('host')!;

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
      logger: undefined!,
      metrics: undefined!,
      reporter: undefined!,
      serverTiming: undefined!,

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

function getRenderMode(
  req: HonoRequest,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
): 'ssr' | 'csr' {
  if (isSSR) {
    if (
      forceCSR &&
      (req.query('csr') ||
        req.header(`x-${cutNameByHyphen(framework)}-ssr-fallback`))
    ) {
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}
