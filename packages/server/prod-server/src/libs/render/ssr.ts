import path from 'path';
import { Readable } from 'stream';
import {
  fs,
  LOADABLE_STATS_FILE,
  mime,
  ROUTE_MINIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { RenderResult, ServerHookRunner } from '../../type';
import { TemplateAPI, templateInjectableStream } from '../hook-api/template';
import cache from './cache';
import { SSRServerContext } from './type';
import { createLogger, createMetrics } from './measure';

// It will inject _SERVER_DATA twice, when SSG mode.
// The first time was in ssg html created, the seoncd time was in prod-server start.
// but the second wound causes route error.
// To ensure that the second injection fails, the _SERVER_DATA inject at the front of head,
const injectSeverData = (content: string, context: ModernServerContext) => {
  const template = new TemplateAPI(content);
  template.prependHead(
    `<script>window._SERVER_DATA=${JSON.stringify(
      context.serverData,
    )}</script>`,
  );
  return template.get();
};

const injectServerDataStream = (
  content: Readable,
  context: ModernServerContext,
) => {
  return content.pipe(
    templateInjectableStream({
      prependHead: `<script>window._SERVER_DATA=${JSON.stringify(
        context.serverData,
      )}</script>`,
    }),
  );
};

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
  } = renderOptions;
  const bundleJS = path.join(distDir, bundle);
  const loadableUri = path.join(distDir, LOADABLE_STATS_FILE);
  const loadableStats = fs.existsSync(loadableUri) ? require(loadableUri) : '';
  const routesManifestUri = path.join(distDir, ROUTE_MINIFEST_FILE);
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
  };
  context.logger = createLogger(context, ctx.logger);
  context.metrics = createMetrics(context, ctx.metrics);

  runner.extendSSRContext(context);
  const serverRender = require(bundleJS)[SERVER_RENDER_FUNCTION_NAME];
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
      content: injectSeverData(content, ctx),
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
