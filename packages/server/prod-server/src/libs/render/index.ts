import path from 'path';
import { cutNameByHyphen, mime } from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { ServerOptions } from '@modern-js/server-core';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { RenderResult, ServerHookRunner } from '../../type';
import { ModernRoute } from '../route';
import { ERROR_DIGEST } from '../../constants';
import { shouldFlushServerHeader } from '../preload/shouldFlushServerHeader';
import { handleDirectory } from './static';
import * as ssr from './ssr';
import { injectServerData } from './utils';
import { SSRRenderOptions } from './ssr';

export type RenderHandler = (options: {
  ctx: ModernServerContext;
  route: ModernRoute;
  runner: ServerHookRunner;
}) => Promise<RenderResult | null>;

type CreateRenderHandler = (ctx: {
  distDir: string;
  staticGenerate: boolean;
  conf: ServerOptions;
  ssrRender?: typeof ssr.render;
  forceCSR?: boolean;
  nonce?: string;
  metaName?: string;
}) => RenderHandler;

const calcFallback = (metaName: string) =>
  `x-${cutNameByHyphen(metaName)}-ssr-fallback`;

export const createRenderHandler: CreateRenderHandler = ({
  distDir,
  staticGenerate,
  conf,
  forceCSR,
  nonce,
  ssrRender,
  metaName = 'modern-js',
}: {
  distDir: string;
  staticGenerate: boolean;
  conf: ServerOptions;
  ssrRender?: typeof ssr.render;
  forceCSR?: boolean;
  nonce?: string;
  metaName?: string;
}): RenderHandler =>
  async function render({
    ctx,
    route,
    runner,
  }: {
    ctx: ModernServerContext;
    route: ModernRoute;
    runner: ServerHookRunner;
  }): Promise<RenderResult | null> {
    if (ctx.resHasHandled()) {
      return null;
    }

    const { entryPath, urlPath } = route;
    const entry = path.join(distDir, entryPath);

    if (!route.isSPA) {
      const result = await handleDirectory(ctx, entry, urlPath);
      return result;
    }

    const templatePath = entry;
    const content = await fileReader.readFile(templatePath);
    if (!content) {
      return null;
    }

    // handles ssr first
    const useCSR =
      forceCSR && (ctx.query.csr || ctx.headers[calcFallback(metaName)]);
    if (route.isSSR && !useCSR) {
      try {
        const userAgent = ctx.getReqHeader('User-Agent') as string | undefined;
        // get disablePreload symbol from
        // the header is `x-modern-disable-preload`
        const disablePreload = Boolean(
          ctx.headers[`x-${cutNameByHyphen(metaName)}-disable-preload`],
        );

        if (shouldFlushServerHeader(conf.server, userAgent, disablePreload)) {
          const { flushServerHeader } = await import('../preload');
          flushServerHeader({
            serverConf: conf.server,
            ctx,
            distDir,
            template: content.toString(),
            headers: {
              'Content-Type': mime.contentType(
                path.extname(templatePath),
              ) as string,
            },
          });
        }
        const ssrRenderOptions: SSRRenderOptions = {
          distDir,
          route,
          template: content.toString(),
          staticGenerate,
          nonce,
        };
        const result = await (ssrRender
          ? ssrRender(ctx, ssrRenderOptions, runner)
          : ssr.render(ctx, ssrRenderOptions, runner));
        return result;
      } catch (err) {
        ctx.error(
          ERROR_DIGEST.ERENDER,
          (err as Error).stack || (err as Error).message,
        );
        ctx.res.set(calcFallback(metaName), '1');
      }
    }

    return {
      content: route.entryName
        ? injectServerData(content.toString(), ctx)
        : content,
      contentType: mime.contentType(path.extname(templatePath)) as string,
    };
  };
