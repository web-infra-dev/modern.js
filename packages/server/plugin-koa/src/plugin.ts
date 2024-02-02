import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import Koa, { Middleware } from 'koa';
import type Application from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import { APIHandlerInfo } from '@modern-js/bff-core';
import { fs, compatRequire } from '@modern-js/utils';
import type { ServerPlugin } from '@modern-js/server-core';
import { httpCallBack2HonoMid } from '@modern-js/server-core/base';
import { run } from './context';
import registerRoutes from './registerRoutes';

type Render = (
  req: IncomingMessage,
  res: ServerResponse,
  url?: string,
) => Promise<string | Readable | null>;

const findAppModule = async (apiDir: string) => {
  const exts = ['.ts', '.js'];
  const paths = exts.map(ext => path.join(apiDir, `app${ext}`));

  for (const filename of paths) {
    if (await fs.pathExists(filename)) {
      // 每次获取 app.ts 的时候，避免使用缓存的 app.ts
      delete require.cache[filename];
      return compatRequire(filename);
    }
  }

  return null;
};

const initMiddlewares = (
  middleware: (Middleware | string)[],
  app: Application,
) => {
  middleware.forEach(middlewareItem => {
    const middlewareFunc =
      typeof middlewareItem === 'string'
        ? compatRequire(middlewareItem)
        : middlewareItem;
    app.use(middlewareFunc);
  });
};

const createApp = async ({
  apiDir,
  middlewares,
  mode,
  apiHandlerInfos,
  render,
}: {
  apiDir: string;
  middlewares: Middleware[];
  mode: 'function' | 'framework';
  apiHandlerInfos: APIHandlerInfo[];
  render?: Render;
}) => {
  let app: Application;
  const router = new Router();

  if (mode === 'framework') {
    app = await findAppModule(apiDir);
    if (!(app instanceof Koa)) {
      app = new Koa();
      app.use(
        koaBody({
          multipart: true,
        }),
      );
    }

    if (middlewares && middlewares.length > 0) {
      initMiddlewares(middlewares, app);
    }

    app.use(run);
    registerRoutes(router, apiHandlerInfos);
  } else if (mode === 'function') {
    app = new Koa();
    app.use(
      koaBody({
        multipart: true,
      }),
    );
    if (middlewares && middlewares.length > 0) {
      initMiddlewares(middlewares, app);
    }
    app.use(run);
    registerRoutes(router, apiHandlerInfos);
  } else {
    throw new Error(`mode must be function or framework`);
  }

  app.use(router.routes());
  if (render) {
    app.use(async (ctx, next) => {
      const html = await render(ctx.req, ctx.res);
      if (html) {
        ctx.body = html;
      }
      await next();
    });
  }
  return app;
};

export default (): ServerPlugin => {
  let app: Application;
  let apiDir: string;
  let mode: 'function' | 'framework';
  let renderHtml: Render | undefined;
  return {
    name: '@modern-js/plugin-koa',
    pre: ['@modern-js/plugin-bff'],
    post: ['@modern-js/plugin-server'],
    setup: api => ({
      async onApiChange(changes) {
        const appContext = api.useAppContext();
        const middlewares = appContext.apiMiddlewares as Middleware[];
        const apiHandlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];
        app = await createApp({
          apiDir,
          middlewares,
          mode,
          apiHandlerInfos,
          render: renderHtml,
        });
        return changes;
      },
      async prepareApiServer({ pwd, render }) {
        const appContext = api.useAppContext();
        const apiHandlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];
        const { apiDirectory } = appContext;
        const userConfig = api.useConfigContext();
        const middlewares = appContext.apiMiddlewares as Middleware[];
        mode = appContext.apiMode as 'function' | 'framework';
        renderHtml =
          userConfig.bff?.enableHandleWeb && render ? render : undefined;
        apiDir = apiDirectory || path.join(pwd, './api');

        app = await createApp({
          apiDir,
          middlewares,
          mode,
          apiHandlerInfos,
          render: renderHtml,
        });

        const callback = (req: IncomingMessage, res: ServerResponse) => {
          return Promise.resolve(app.callback()(req, res));
        };

        return httpCallBack2HonoMid(callback);
      },
    }),
  };
};
