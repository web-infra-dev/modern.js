import path from 'path';
import { cutNameByHyphen, mime } from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { RenderResult, ServerHookRunner } from '../../type';
import { ModernRoute } from '../route';
import { ERROR_DIGEST } from '../../constants';
import { handleDirectory } from './static';
import { readFile } from './reader';
import * as ssr from './ssr';
import { injectServerData } from './utils';

export const createRenderHandler = ({
  distDir,
  staticGenerate,
  forceCSR,
  nonce,
  metaName = 'modern-js',
}: {
  distDir: string;
  staticGenerate: boolean;
  forceCSR?: boolean;
  nonce?: string;
  metaName?: string;
}) =>
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
    const content = await readFile(templatePath);
    if (!content) {
      return null;
    }

    // handles ssr first
    const useCSR =
      forceCSR &&
      (ctx.query.csr ||
        ctx.headers[`x-${cutNameByHyphen(metaName)}-ssr-fallback`]);
    if (route.isSSR && !useCSR) {
      try {
        const result = await ssr.render(
          ctx,
          {
            distDir,
            entryName: route.entryName,
            urlPath: route.urlPath,
            bundle: route.bundle,
            template: content.toString(),
            staticGenerate,
            nonce,
          },
          runner,
        );
        return result;
      } catch (err) {
        ctx.error(
          ERROR_DIGEST.ERENDER,
          (err as Error).stack || (err as Error).message,
        );
        ctx.res.setHeader('x-modern-ssr-fallback', '1');
      }
    }

    return {
      content: route.entryName
        ? injectServerData(content.toString(), ctx)
        : content,
      contentType: mime.contentType(path.extname(templatePath)) as string,
    };
  };
