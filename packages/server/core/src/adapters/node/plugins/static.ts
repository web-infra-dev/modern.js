import path from 'path';
import { fs } from '@modern-js/utils';
import { getMimeType } from 'hono/utils/mime';
import { ServerRoute } from '@modern-js/types';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type {
  OutputNormalizedConfig,
  HtmlNormalizedConfig,
  HonoRequest,
  Middleware,
  ServerPlugin,
} from '../../../types';
import { sortRoutes } from '../../../utils';

export const serverStaticPlugin = (): ServerPlugin => ({
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
    const route = matchRoute(c.req, routes);

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

function matchRoute(req: HonoRequest, routes: ServerRoute[]) {
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

export function createStaticMiddleware(
  options: ServerStaticOptions,
): Middleware {
  const { pwd, routes } = options;
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
      const chunk = await fileReader.readFile(filepath, 'buffer');

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
