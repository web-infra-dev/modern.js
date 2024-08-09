import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import express, { RequestHandler, Express } from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { APIHandlerInfo } from '@modern-js/bff-core';
import { compatibleRequire, fs, logger } from '@modern-js/utils';
import finalhandler from 'finalhandler';
import type {
  Render,
  ServerManifest,
  ServerPlugin,
  InternalRequest,
} from '@modern-js/server-core';
import {
  httpCallBack2HonoMid,
  sendResponse,
} from '@modern-js/server-core/node';
import { run } from './context';
import registerRoutes from './registerRoutes';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      __honoRequest: InternalRequest;
      __templates: Record<string, string>;
      __serverManifest: ServerManifest;
    }
  }
}

type Middleware = RequestHandler | string;

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
      return [await compatibleRequire(filename), require(filename)];
    }
  }

  return [];
};

const initMiddlewares = async (middleware: Middleware[], app: Express) => {
  for (const middlewareItem of middleware) {
    const middlewareFunc =
      typeof middlewareItem === 'string'
        ? await compatibleRequire(middlewareItem)
        : middlewareItem;

    app.use(middlewareFunc);
  }
};

const useRun = (app: Express) => {
  app.use((req, res, next) => {
    run({ req, res }, next);
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
  let app: Express;
  if (mode === 'framework') {
    const appModule = await findAppModule(apiDir);
    app = appModule[0];
    const hooks: Hooks = appModule[1];

    if (!app?.use) {
      app = express();
    }
    initApp(app);
    if (middlewares && middlewares.length > 0) {
      await initMiddlewares(middlewares, app);
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

    if (middlewares && middlewares.length > 0) {
      await initMiddlewares(middlewares, app);
    }

    useRun(app);

    registerRoutes(app, apiHandlerInfos);
  } else {
    throw new Error(`mode must be function or framework`);
  }

  if (render) {
    // eslint-disable-next-line consistent-return
    app.use(async (req, res, next) => {
      const response = await render(req.__honoRequest.raw, {
        logger,
        nodeReq: req,
        templates: req.__templates,
        serverManifest: req.__serverManifest,
      });
      if (response) {
        return sendResponse(response, res).then(next);
      }
      next();
    });
  }

  return app;
};

const initApp = (app: express.Express) => {
  app.use(cookieParser());
  app.use(express.text());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  return app;
};

export default (): ServerPlugin => {
  let app: Express;
  let apiDir: string;
  let mode: 'function' | 'framework';
  let renderHtml: Render | undefined;
  return {
    name: '@modern-js/plugin-express',
    pre: ['@modern-js/plugin-bff'],
    post: ['@modern-js/plugin-server'],
    setup: api => ({
      async reset({ event }) {
        if (event.type === 'file-change') {
          const appContext = api.useAppContext();
          const middlewares = appContext.apiMiddlewares as Middleware[];
          const apiHandlerInfos =
            appContext.apiHandlerInfos as APIHandlerInfo[];
          app = await createApp({
            apiDir,
            middlewares,
            mode,
            apiHandlerInfos,
            render: renderHtml,
          });
        }
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

        const handler = (req: IncomingMessage, res: ServerResponse) =>
          new Promise<void>((resolve, reject) => {
            const handler = (err: any) => {
              if (err) {
                return reject(err);
              }
              // finalhanlder will trigger 'finish' event
              finalhandler(req, res, {})(null);
              return resolve();
            };

            res.on('finish', (err: Error) => {
              if (err) {
                return reject(err);
              }
              return resolve();
            });

            return app(req as Request, res as Response, handler);
          });
        return httpCallBack2HonoMid(handler);
      },
    }),
  };
};
