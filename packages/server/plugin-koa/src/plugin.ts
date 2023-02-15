import * as path from 'path';
import Koa, { Middleware } from 'koa';
import type Application from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import { APIHandlerInfo } from '@modern-js/bff-core';
import { fs, compatRequire } from '@modern-js/utils';
import type { ServerPlugin } from '@modern-js/server-core';
import { run } from './context';
import registerRoutes from './registerRoutes';

interface FrameConfig {
  middleware: (Middleware | string)[];
}

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

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-koa',
  pre: ['@modern-js/plugin-bff'],
  post: ['@modern-js/plugin-server'],
  setup: api => ({
    async prepareApiServer({ pwd, config, render }) {
      let app: Application;
      const router = new Router();
      const apiDir = path.join(pwd, './api');
      const appContext = api.useAppContext();
      const apiHandlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];
      const mode = appContext.apiMode;
      const userConfig = api.useConfigContext();

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

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
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
        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }

        app.use(run);
        registerRoutes(router, apiHandlerInfos);
      } else {
        throw new Error(`mode must be function or framework`);
      }

      app.use(router.routes());
      if (userConfig.bff?.enableHandleWeb && render) {
        app.use(async (ctx, next) => {
          const html = await render(ctx.req, ctx.res);
          if (html) {
            ctx.body = html;
          }
          await next();
        });
      }

      return (req, res) => {
        return Promise.resolve(app.callback()(req, res));
      };
    },
    prepareWebServer({ config }, next) {
      const userConfig = api.useConfigContext();
      if (!userConfig?.server?.enableFrameworkExt) {
        return next();
      }
      const app: Application = new Koa();

      app.use(async (ctx, next) => {
        await next();
        if (!ctx.body) {
          // restore statusCode
          if (
            ctx.res.statusCode === 404 &&
            !(ctx.response as any)._explicitStatus
          ) {
            ctx.res.statusCode = 200;
          }
          ctx.respond = false;
        }
      });

      app.use(koaBody());
      if (config) {
        const { middleware } = config as FrameConfig;
        initMiddlewares(middleware, app);
      }

      return ctx => {
        const {
          source: { req, res },
        } = ctx;
        app.on('error', err => {
          if (err) {
            throw err;
          }
        });
        return Promise.resolve(app.callback()(req, res));
      };
    },
  }),
});
