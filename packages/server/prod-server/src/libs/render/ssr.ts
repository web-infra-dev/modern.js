import path from 'path';
import {
  fs,
  mime,
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { RenderResult, ServerHookRunner } from '../../type';
import cache from './cache';
import { SSRServerContext } from './type';
import { createLogger, createMetrics } from './measure';
import { injectServerDataStream, injectServerData } from './utils';

export const render = async (
  ctx: ModernServerContext,
  renderOptions: {
    distDir: string;
    bundle: string;
    urlPath: string;
    template: string;
    entryName: string;
    staticGenerate: boolean;
    enableUnsafeCtx?: boolean;
    nonce?: string;
  },
  runner: ServerHookRunner,
): Promise<RenderResult> => {
  const {
    urlPath,
    bundle,
    distDir,
    template,
    entryName,
    staticGenerate,
    enableUnsafeCtx = false,
    nonce,
  } = renderOptions;
  const bundleJS = path.join(distDir, bundle);
  const loadableUri = path.join(distDir, LOADABLE_STATS_FILE);
  const loadableStats = fs.existsSync(loadableUri) ? require(loadableUri) : '';
  const routesManifestUri = path.join(distDir, ROUTE_MANIFEST_FILE);
  const routeManifest = fs.existsSync(routesManifestUri)
    ? require(routesManifestUri)
    : undefined;

  const context: SSRServerContext = {
    request: {
      baseUrl: urlPath,
      params: ctx.params,
      pathname: ctx.path,
      host: ctx.host,
      query: ctx.query as Record<string, string>,
      url: ctx.href,
      headers: ctx.headers,
      body: ctx.req.body,
    },
    response: {
      setHeader: (key, value) => {
        return ctx.res.setHeader(key, value);
      },
      status: code => {
        ctx.res.statusCode = code;
      },
      locals: ctx.res?.locals || {},
    },
    redirection: {},
    template,
    loadableStats,
    routeManifest, // for streaming ssr
    entryName,
    staticGenerate,
    logger: undefined!,
    metrics: undefined!,
    req: ctx.req,
    res: ctx.res,
    enableUnsafeCtx,
    nonce,
  };
  context.logger = createLogger(context, ctx.logger);
  context.metrics = createMetrics(context, ctx.metrics);

  runner.extendSSRContext(context);
  const bundleJSContent = await Promise.resolve(require(bundleJS));
  const serverRender = bundleJSContent[SERVER_RENDER_FUNCTION_NAME];
  const content = await cache(serverRender, ctx)(context);

  const { url, status = 302 } = context.redirection;

  if (url) {
    return {
      content: url,
      contentType: '',
      statusCode: status,
      redirect: true,
    };
  }

  if (typeof content === 'string') {
    return {
      content: injectServerData(content, ctx),
      contentType: mime.contentType('html') as string,
    };
  } else {
    return {
      content: '',
      contentStream: injectServerDataStream(content, ctx),
      contentType: mime.contentType('html') as string,
    };
  }
};
