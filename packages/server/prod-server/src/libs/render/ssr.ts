import path from 'path';
import {
  fs,
  mime,
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import * as isbot from 'isbot';
import { RenderResult, ServerHookRunner } from '../../type';
import { createAfterStreamingRenderContext } from '../hook-api';
import { afterRenderInjectableStream } from '../hook-api/afterRenderForStream';
import type { ModernRoute } from '../route';
import { RenderFunction, SSRServerContext } from './type';
import { createLogger, createMetrics } from './measure';
import { injectServerDataStream, injectServerData } from './utils';
import { ssrCache } from './ssrCache';

export type SSRRenderOptions = {
  distDir: string;
  template: string;
  route: ModernRoute;
  staticGenerate: boolean;
  enableUnsafeCtx?: boolean;
  nonce?: string;
};

export const render = async (
  ctx: ModernServerContext,
  renderOptions: SSRRenderOptions,
  runner: ServerHookRunner,
): Promise<RenderResult> => {
  const {
    distDir,
    route,
    template,
    staticGenerate,
    enableUnsafeCtx = false,
    nonce,
  } = renderOptions;
  const { urlPath, bundle, entryName } = route;
  const bundleJS = path.join(distDir, bundle);
  const loadableUri = path.join(distDir, LOADABLE_STATS_FILE);
  const loadableStats = fs.existsSync(loadableUri) ? require(loadableUri) : '';
  const routesManifestUri = path.join(distDir, ROUTE_MANIFEST_FILE);
  const routeManifest = fs.existsSync(routesManifestUri)
    ? require(routesManifestUri)
    : undefined;

  const isSpider = isbot.default(ctx.headers['user-agent'] || null);

  const context: SSRServerContext = {
    request: {
      baseUrl: urlPath,
      params: ctx.params,
      pathname: ctx.path,
      host: ctx.host,
      query: ctx.query as Record<string, string>,
      url: ctx.href,
      headers: ctx.headers,
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
    reporter: ctx.reporter,
    serverTiming: ctx.serverTiming,
    req: ctx.req,
    res: ctx.res,
    enableUnsafeCtx,
    isSpider,
    nonce,
  };
  context.logger = createLogger(context, ctx.logger);
  context.metrics = createMetrics(context, ctx.metrics);

  runner.extendSSRContext(context);
  const bundleJSContent = await Promise.resolve(require(bundleJS));
  const serverRender: RenderFunction =
    bundleJSContent[SERVER_RENDER_FUNCTION_NAME];

  const { data: content, status: cacheStatus } = await ssrCache(
    ctx.req,
    serverRender,
    context,
  );

  const { url, status = 302 } = context.redirection;

  if (url) {
    return {
      content: url,
      contentType: '',
      statusCode: status,
      redirect: true,
    };
  }

  const headers: Record<string, string> = {};
  cacheStatus && (headers['x-render-cache'] = cacheStatus);

  if (typeof content === 'string') {
    return {
      content: injectServerData(content, ctx),
      contentType: mime.contentType('html') as string,
      headers,
    };
  } else {
    let contentStream = injectServerDataStream(content, ctx);
    const afterStreamingRenderContext = createAfterStreamingRenderContext(
      ctx,
      route,
    );
    contentStream = contentStream.pipe(
      afterRenderInjectableStream((chunk: string) => {
        const context = afterStreamingRenderContext(chunk);
        return runner.afterStreamingRender(context, {
          onLast: ({ chunk }) => chunk,
        });
      }),
    );

    return {
      content: '',
      contentStream,
      contentType: mime.contentType('html') as string,
      headers,
    };
  }
};
