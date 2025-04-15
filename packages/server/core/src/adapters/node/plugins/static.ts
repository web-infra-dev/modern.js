import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { getMimeType } from 'hono/utils/mime';
import type {
  HonoRequest,
  HtmlNormalizedConfig,
  Middleware,
  OutputNormalizedConfig,
  ServerPluginLegacy,
} from '../../../types';
import { sortRoutes } from '../../../utils';

export const serverStaticPlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-server-static',

  setup(api) {
    return {
      prepare() {
        const { middlewares, distDirectory: pwd, routes } = api.useAppContext();

        const config = api.useConfigContext();

        const serverStaticMiddleware = createStaticMiddleware({
          pwd,
          routes,
          output: config.output || {},
          html: config.html || {},
        });

        middlewares.push({
          name: 'server-static',

          handler: serverStaticMiddleware,
        });
      },
    };
  },
});

export type PublicMiddlwareOptions = {
  pwd: string;
  routes: ServerRoute[];
};

export function createPublicMiddleware({
  pwd,
  routes,
}: PublicMiddlwareOptions): Middleware {
  return async (c, next) => {
    const route = matchPublicRoute(c.req, routes);

    if (route) {
      const { entryPath } = route;
      const filename = path.join(pwd, entryPath);
      const data = await fileReader.readFile(filename, 'buffer');
      const mimeType = getMimeType(filename);

      if (data !== null) {
        if (mimeType) {
          c.header('Content-Type', mimeType);
        }

        Object.entries(route.responseHeaders || {}).forEach(([k, v]) => {
          c.header(k, v as string);
        });

        return c.body(data, 200);
      }
    }

    return await next();
  };
}

function matchPublicRoute(req: HonoRequest, routes: ServerRoute[]) {
  for (const route of routes.sort(sortRoutes)) {
    if (
      !route.isSSR &&
      route.entryPath.startsWith('public') &&
      req.path.startsWith(route.urlPath)
    ) {
      return route;
    }
  }
  return undefined;
}

export interface ServerStaticOptions {
  pwd: string;
  output: OutputNormalizedConfig;
  html: HtmlNormalizedConfig;
  routes?: ServerRoute[];
}

/**
 * This middleware is used to serve static assets
 * TODO: In next major version, only serve static assets in the `static` and `upload` directory.
 *
 * 1. In dev mode, the static assets generated by bundler will be served by the rsbuildDevMiddleware, and other file in `static` directory will be served by this middleware.
 * 2. In prod mode, all the static assets in `static` and `upload` directory will be served by this middleware.
 * 3. So some file not in `static` can be access in dev mode, but not in prod mode. Cause we can not serve all files in prod mode, as we should not expose server code in prod mode.
 * 4. Through Modern.js not serve this file in prod mode, you can upload the files to a CDN.
 */
export function createStaticMiddleware(
  options: ServerStaticOptions,
): Middleware {
  const { pwd, routes } = options;
  const prefix = options.output.assetPrefix || '/';

  const {
    distPath: { css: cssPath, js: jsPath, media: mediaPath } = {},
  } = options.output;
  const { favicon, faviconByEntries } = options.html;
  const favicons = prepareFavicons(favicon, faviconByEntries);
  const staticFiles = [cssPath, jsPath, mediaPath].filter(v => Boolean(v));

  // TODO: If possible, we should not use `...staticFiles` here, file should only be read in static and upload dir.
  const staticReg = ['static/', 'upload/', ...staticFiles];
  // TODO: Also remove iconReg
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
    // If page route hit, we should skip static middleware for performance
    const pageRoute = c.get('route');
    if (pageRoute) {
      return next();
    }

    // exist is path
    const pathname = c.req.path;
    const hit = staticPathRegExp.test(pathname);

    // FIXME: shoudn't hit, when cssPath, jsPath, mediaPath as '.'
    if (hit) {
      const filepath = path.join(
        pwd,
        pathname.replace(prefix, () => ''),
      );
      if (!(await fs.pathExists(filepath))) {
        // FIXME: we shoud return a response with status is 404, if we can't found static asset
        // return c.html(createErrorHtml(404), 404);

        // In some case, page route would hit the staticPathRegExp.
        // So we call next().
        return next();
      }
      const mimeType = getMimeType(filepath);
      if (mimeType) {
        c.header('Content-Type', mimeType);
      }
      const stat = await fs.lstat(filepath);
      const { size } = stat;
      // serve static middleware always read file from real filesystem.
      const chunk = await fileReader.readFileFromSystem(filepath, 'buffer');

      // TODO: handle http range
      c.header('Content-Length', String(size));
      return c.body(chunk, 200);
    } else {
      return createPublicMiddleware({ pwd, routes: routes || [] })(c, next);
    }
  };
}

const prepareFavicons = (
  favicon?: string | ((o: { entryName: string; value: string }) => string),
  faviconByEntries?: Record<string, string | undefined>,
) => {
  const faviconNames = [];

  // TODO: handle favicon as function.
  if (favicon && typeof favicon === 'string') {
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
