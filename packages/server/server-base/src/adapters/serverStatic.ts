import path from 'path';
import { existsSync, lstatSync } from 'fs';
import { readFile } from 'fs/promises';
import { Context } from 'hono';
import { getMimeType } from 'hono/utils/mime';
import {
  HtmlNormalizedConfig,
  OutputNormalizedConfig,
} from '@modern-js/server-core';
import { Middleware } from '../types';

interface ServerStaticOptions {
  distDir: string;
  output: OutputNormalizedConfig;
  html: HtmlNormalizedConfig;
  onNotFound?: (path: string, c: Context) => void | Promise<void>;
}

export function createStaticMiddleware(
  options: ServerStaticOptions,
): Middleware {
  const { distDir } = options;
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

  return async (c, next) => {
    // exist is path
    const pathname = c.req.path;

    const hit = staticPathRegExp.test(pathname);

    if (hit) {
      const filepath = path.resolve(
        distDir,
        pathname.replace(prefix, () => ''),
      );
      if (!existsSync(filepath)) {
        await options.onNotFound?.(filepath, c);
        return next();
      }
      const mimeType = getMimeType(filepath);
      if (mimeType) {
        c.header('Content-Type', mimeType);
      }
      const stat = lstatSync(filepath);
      const { size } = stat;
      const chunk = await readFile(filepath);

      c.header('Content-Length', String(size));
      return c.body(chunk, 206);
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
