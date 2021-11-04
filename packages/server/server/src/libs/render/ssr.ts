import path from 'path';
import { SERVER_RENDER_FUNCTION_NAME } from '@modern-js/utils';
import mime from 'mime-types';
import { ModernServerContext } from '../context';
import { RenderResult } from '../../type';
import cache from './cache';
import { SSRServerContext } from './type';

export const render = async (
  ctx: ModernServerContext,
  renderOptions: {
    distDir: string;
    bundle: string;
    template: string;
    entryName: string;
    staticGenerate: boolean;
  },
): Promise<RenderResult> => {
  const { bundle, distDir, template, entryName, staticGenerate } =
    renderOptions;
  const bundleJS = path.join(distDir, bundle);

  const context: SSRServerContext = {
    request: {
      params: ctx.params,
      pathname: ctx.path,
      query: ctx.query as Record<string, string>,
      headers: ctx.headers,
      cookie: ctx.headers.cookie,
    },
    redirection: {},
    template,
    entryName,
    distDir,
    staticGenerate,
    logger: ctx.logger,
    measure: ctx.measure,
  };

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
