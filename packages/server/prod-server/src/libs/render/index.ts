import path from 'path';
import { fs, mime } from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { RenderResult, ServerHookRunner } from '../../type';
import { ModernRoute } from '../route';
import { ERROR_DIGEST } from '../../constants';
import { handleDirectory } from './static';
import { readFile } from './reader';
import * as ssr from './ssr';

export const createRenderHandler = ({
  distDir,
  staticGenerate,
  forceCSR,
}: {
  distDir: string;
  staticGenerate: boolean;
  forceCSR?: boolean;
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

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Could not find template file: ${templatePath}`);
    }

    const content = await readFile(templatePath);
    if (!content) {
      return null;
    }

    // handles ssr first
    const useCSR = forceCSR && ctx.query.csr;
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
            loadContext: ctx.loadContext,
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
      content,
      contentType: mime.contentType(path.extname(templatePath)) as string,
    };
  };
