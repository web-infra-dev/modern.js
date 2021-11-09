import * as path from 'path';
import express, { RequestHandler, Express } from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { createPlugin } from '@modern-js/server-plugin';
import { requireModule } from '@modern-js/bff-utils';
import { fs, createDebugger } from '@modern-js/utils';
import finalhandler from 'finalhandler';
import { run } from './context';
import registerRoutes from './registerRoutes';

const debug = createDebugger('express');

interface FrameConfig {
  middleware: (RequestHandler | string)[];
}

export type Mode = 'function' | 'framework';

const findAppModule = async (apiDir: string) => {
  const exts = ['.ts', '.js'];
  const paths = exts.map(ext => path.resolve(apiDir, `app${ext}`));

  for (const filename of paths) {
    if (await fs.pathExists(filename)) {
      return requireModule(filename);
    }
  }

  return null;
};

const initMiddlewares = (
  middleware: (RequestHandler | string)[],
  app: Express,
) => {
  middleware.forEach(middlewareItem => {
    const middlewareFunc =
      typeof middlewareItem === 'string'
        ? requireModule(middlewareItem)
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

export default createPlugin(
  () => ({
    // eslint-disable-next-line max-statements
    async prepareApiServer({ pwd, mode, config }) {
      let app: Express;
      const apiDir = path.join(pwd, './api');
      if (mode === 'framework') {
        app = await findAppModule(apiDir);

        if (!app || !app.use) {
          console.warn('There is not api/app.ts.');
          app = express();
        }
        initApp(app);

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRun(app);

        registerRoutes(app);
      } else if (mode === 'function') {
        app = express();
        initApp(app);

        if (config) {
          const { middleware } = config as FrameConfig;
          initMiddlewares(middleware, app);
        }

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRun(app);

        registerRoutes(app);
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

    prepareWebServer({ config }) {
      const app = express();
      initApp(app);
      if (config) {
        const { middleware } = config as FrameConfig;
        debug('web middleware', middleware);
        initMiddlewares(middleware, app);
      }

      return (req, res) =>
        new Promise((resolve, reject) => {
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
  {
    name: '@modern-js/plugin-express',
    pre: ['@modern-js/plugin-bff'],
  },
) as any;
