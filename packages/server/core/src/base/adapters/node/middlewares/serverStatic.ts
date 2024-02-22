import path from 'path';
import { existsSync, lstatSync } from 'fs';
import { readFile } from 'fs/promises';
import { getMimeType } from 'hono/utils/mime';
import type {
  OutputNormalizedConfig,
  HtmlNormalizedConfig,
} from '../../../../types/config';
import { createErrorHtml } from '../../../utils';
import { Middleware } from '../../../../core/server';

interface ServerStaticOptions {
  pwd: string;
  output: OutputNormalizedConfig;
  html: HtmlNormalizedConfig;
}

export function createStaticMiddleware(
  options: ServerStaticOptions,
): Middleware {
  const { pwd } = options;
  const prefix = options.output.assetPrefix || '/';

  const { distPath: { css: cssPath, js: jsPath, media: mediaPath } = {} } =
    options.output;
  const { favicon, faviconByEntries } = options.html;
  const favicons = prepareFavicons(favicon, faviconByEntries);
  const staticFiles = [cssPath, jsPath, mediaPath].filter(v => Boolean(v));

  const staticReg = ['static/', 'upload/', ...staticFiles];
  const iconReg = ['favicon.ico', 'icon.png', ...favicons];
  const regPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const staticPathRegExp = new RegExp(
    `^${regPrefix}(${[...staticReg, ...iconReg].join('|')})`,
  );

  /**
   * The function is modified based on
   * https://github.com/honojs/node-server/blob/main/src/serve-static.ts
   *
   * MIT Licensed
   * https://github.com/honojs/node-server/tree/8cea466fd05e6d2e99c28011fc0e2c2d3f3397c9?tab=readme-ov-file#license
   * */
  return async (c, next) => {
    // exist is path
    const pathname = c.req.path;

    const hit = staticPathRegExp.test(pathname);

    if (hit) {
      const filepath = path.resolve(
        pwd,
        pathname.replace(prefix, () => ''),
      );
      if (!existsSync(filepath)) {
        // we shoud return a response with status is 404, if we can't found static asset
        return c.html(createErrorHtml(404), 404);
      }
      const mimeType = getMimeType(filepath);
      if (mimeType) {
        c.header('Content-Type', mimeType);
      }
      const stat = lstatSync(filepath);
      const { size } = stat;
      const chunk = await readFile(filepath);

      // TODO: handle http range
      c.header('Content-Length', String(size));
      return c.body(chunk, 200);
    } else {
      return next();
    }
  };
}

const prepareFavicons = (
  favicon: string | undefined,
  faviconByEntries?: Record<string, string | undefined>,
) => {
  const faviconNames = [];
  if (favicon) {
    faviconNames.push(favicon.substring(favicon.lastIndexOf('/') + 1));
  }
  if (faviconByEntries) {
    Object.keys(faviconByEntries).forEach(f => {
      const curFavicon = faviconByEntries[f];
      if (curFavicon) {
        faviconNames.push(
          curFavicon.substring(curFavicon.lastIndexOf('/') + 1),
        );
      }
    });
  }
  return faviconNames;
};
