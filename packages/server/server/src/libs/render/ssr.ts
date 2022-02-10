import path from 'path';
import { SERVER_RENDER_FUNCTION_NAME } from '@modern-js/utils';
import mime from 'mime-types';
import cookie from 'cookie';
import { ModernServerContext } from '../context';
import { RenderResult, ServerHookRunner } from '../../type';
import cache from './cache';
import { SSRServerContext } from './type';

export const render = async (
  ctx: ModernServerContext,
  renderOptions: {
    distDir: string;
    bundle: string;
    urlPath: string;
    template: string;
    entryName: string;
    staticGenerate: boolean;
  },
  runner: ServerHookRunner,
): Promise<RenderResult> => {
  const { urlPath, bundle, distDir, template, entryName, staticGenerate } =
    renderOptions;
  const bundleJS = path.join(distDir, bundle);

  const context: SSRServerContext = {
    request: {
      baseUrl: urlPath,
      params: ctx.params,
      pathname: ctx.path,
      host: ctx.host,
      query: ctx.query as Record<string, string>,
      url: ctx.href,
      cookieMap: cookie.parse(ctx.headers.cookie || ''),
      headers: ctx.headers,
    },
    redirection: {},
    template,
    entryName,
    distDir,
    staticGenerate,
    logger: ctx.logger,
    metrics: ctx.metrics,
  };

  runner.extendSSRContext(context);

  const serverRender = require(bundleJS)[SERVER_RENDER_FUNCTION_NAME];

  const html = await cache(serverRender, ctx)(context);

  const { url, status = 302 } = context.redirection;

  if (url) {
    return {
      content: url,
      contentType: '',
      statusCode: status,
      redirect: true,
    };
  }

  return {
    content: html,
    contentType: mime.contentType('html') as string,
  };
};
