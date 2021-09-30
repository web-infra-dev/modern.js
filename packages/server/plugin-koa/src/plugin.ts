import * as path from 'path';
import Koa, { Middleware } from 'koa';
import type Application from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import { createPlugin } from '@modern-js/server-plugin';
import { requireModule } from '@modern-js/bff-utils';
import { fs } from '@modern-js/utils';
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
      return requireModule(filename);
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
        ? requireModule(middlewareItem)
        : middlewareItem;
    app.use(middlewareFunc);
  });
};

export type Mode = 'function' | 'framework';

export default createPlugin(
  () => ({
    // eslint-disable-next-line max-statements
    async prepareApiServer({ pwd, mode, config, prefix }) {
      let app: Application;
      const router = new Router();
      const apiDir = path.join(pwd, './api');

      if (mode === 'framework') {
        app = await findAppModule(apiDir);
        if (!(app instanceof Koa)) {
          app = new Koa();
          app.use(koaBody());
        }

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }

        app.use(run);
        registerRoutes(router, prefix as string);
      } else if (mode === 'function') {
        app = new Koa();
        app.use(koaBody());
        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }

        app.use(run);
        registerRoutes(router, prefix as string);
      } else {
        throw new Error(`mode must be function or framework`);
      }

      app.use(router.routes());

      return (req, res) => {
        app.on('error', err => {
          if (err) {
            throw err;
          }
        });
        return Promise.resolve(app.callback()(req, res));
      };
    },
    prepareWebServer({ config }) {
      const app: Application = new Koa();

      app.use(async (ctx, next) => {
        await next();
        if (!ctx.body) {
          // restore statusCode
          if (ctx.res.statusCode === 404) {
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

      return (req, res) => {
        app.on('error', err => {
          if (err) {
            throw err;
          }
        });
        return Promise.resolve(app.callback()(req, res));
      };
    },
  }),
  {
    name: '@modern-js/plugin-koa',
    pre: ['@modern-js/plugin-bff'],
  },
) as any;
