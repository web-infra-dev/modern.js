import path from 'path';
import { fs } from '@modern-js/utils';
import mime from 'mime-types';
import { RenderResult } from '../../type';
import { ModernRoute } from '../route';
import { ModernServerContext } from '../context';
import { handleDirectory } from './static';
import { readFile } from './reader';
import * as ssr from './ssr';
import { supportModern, getModernEntry } from './modern';
import { ERROR_DIGEST } from '@/constants';

export const createRenderHandler = ({
  distDir,
  staticGenerate,
}: {
  distDir: string;
  staticGenerate: boolean;
}) =>
  async function render(
    ctx: ModernServerContext,
    route: ModernRoute,
  ): Promise<RenderResult | null> {
    if (ctx.resHasHandled()) {
      return null;
    }

    const { entryPath, urlPath } = route;
    const entry = path.join(distDir, entryPath);

    if (!route.isSPA) {
      const result = await handleDirectory(ctx, entry, urlPath);
      return result;
    }

    // only spa can use es6-html
    const modernEntry = getModernEntry(entry);
    const useModern =
      // route.enableModernMode &&
      supportModern(ctx) && fs.existsSync(modernEntry);
    const templateHTML = useModern ? modernEntry : entry;

    // handles ssr first
    if (route.isSSR) {
      try {
        const result = await ssr.render(ctx, {
          distDir,
          entryName: route.entryName,
          bundle: route.bundle,
          template: templateHTML,
          staticGenerate,
        });
        return result;
      } catch (err) {
        ctx.error(ERROR_DIGEST.ERENDER, (err as Error).stack);
        ctx.res.setHeader('x-modern-ssr-fallback', '1');
      }
    }

    const content = await readFile(templateHTML);
    if (!content) {
      return null;
    }

    return {
      content,
      contentType: mime.contentType(path.extname(templateHTML)) as string,
    };
  };
