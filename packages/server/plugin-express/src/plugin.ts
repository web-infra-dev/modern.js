import * as path from 'path';
import express, { RequestHandler, Express } from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { APIHandlerInfo } from '@modern-js/bff-core';
import { fs, createDebugger, compatRequire } from '@modern-js/utils';
import finalhandler from 'finalhandler';
import type { ServerPlugin } from '@modern-js/server-core';
import { run } from './context';
import registerRoutes from './registerRoutes';

const debug = createDebugger('express');

interface FrameConfig {
  middleware: (RequestHandler | string)[];
}

type Hooks = {
  afterLambdaRegisted?: (app: Express) => void;
};

const findAppModule = async (apiDir: string) => {
  const exts = ['.ts', '.js'];
  const paths = exts.map(ext => path.resolve(apiDir, `app${ext}`));

  for (const filename of paths) {
    if (await fs.pathExists(filename)) {
      // 每次获取 app.ts 的时候，避免使用缓存的 app.ts
      delete require.cache[filename];
      return [compatRequire(filename), require(filename)];
    }
  }

  return [];
};

const initMiddlewares = (
  middleware: (RequestHandler | string)[],
  app: Express,
) => {
  middleware.forEach(middlewareItem => {
    const middlewareFunc =
      typeof middlewareItem === 'string'
        ? compatRequire(middlewareItem)
        : middlewareItem;
    app.use(middlewareFunc);
  });
};

const useRun = (app: Express) => {
  app.use((req, res, next) => {
    run({ req, res }, next);
  });
};

const initApp = (app: express.Express) => {
  app.use(cookieParser());
  app.use(express.text());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  return app;
};

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-express',
  pre: ['@modern-js/plugin-bff'],
  post: ['@modern-js/plugin-server'],
  setup: api => ({
    async prepareApiServer({ pwd, config }) {
      let app: Express;
      const apiDir = path.join(pwd, './api');
      const appContext = api.useAppContext();
      const apiHandlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];
      const mode = appContext.apiMode;

      if (mode === 'framework') {
        const appModule = await findAppModule(apiDir);
        app = appModule[0];
        const hooks: Hooks = appModule[1];

        if (!app || !app.use) {
          // console.warn('There is not api/app.ts.');
          app = express();
        }
        initApp(app);

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }
        useRun(app);

        registerRoutes(app, apiHandlerInfos);
        if (hooks) {
          const { afterLambdaRegisted } = hooks;
          if (afterLambdaRegisted) {
            afterLambdaRegisted(app);
          }
        }
      } else if (mode === 'function') {
        app = express();
        initApp(app);

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }

        useRun(app);

        registerRoutes(app, apiHandlerInfos);
      } else {
        throw new Error(`mode must be function or framework`);
      }

      return (req, res) =>
        new Promise((resolve, reject) => {
          const handler = (err: any) => {
            if (err) {
              return reject(err);
            }
            // finalhanlder will trigger 'finish' event
            return finalhandler(req, res, {})(null);
            // return resolve();
          };

          res.on('finish', (err: Error) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
          return app(req as Request, res as Response, handler);
        });
    },

    prepareWebServer({ config }, next) {
      const userConfig = api.useConfigContext();
      if (userConfig?.server?.disableFrameworkExt) {
        return next();
      }

      const app = express();
      initApp(app);
      if (config) {
        const { middleware } = config as FrameConfig;
        debug('web middleware', middleware);
        initMiddlewares(middleware, app);
      }

      return ctx =>
        new Promise((resolve, reject) => {
          const {
            source: { req, res },
          } = ctx;
          const handler = (err: string) => {
            if (err) {
              return reject(err);
            }
            if (res.headersSent && res.statusCode !== 200) {
              finalhandler(req, res, {})(null);
            }
            return resolve();
          };

          // when user call res.send
          res.on('finish', (err: Error) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
          return app(req as Request, res as Response, handler);
        });
    },
  }),
});
